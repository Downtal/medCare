package com.medcare.orderservice.service;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemDto;
import com.medcare.orderservice.dto.CartItemRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductClient productClient;
    private static final String CART_PREFIX = "cart:";
    private static final long CART_TTL_DAYS = 7;

    public void addItemToCart(String cartId, CartItemRequest request) {
        String key = CART_PREFIX + cartId;
        
        // Securely fetch current product info
        ProductClient.ProductDto product = productClient.getProductById(request.getMedicineId());
        if (product == null) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        // Check stock before adding
        if (product.getStockQuantity() != null && product.getStockQuantity() <= 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Sản phẩm hiện đang hết hàng.");
        }

        // Convert Request to DTO for storage
        String hashKey = String.valueOf(request.getMedicineId());
        CartItemDto item = null;
        try {
            item = (CartItemDto) redisTemplate.opsForHash().get(key, hashKey);
        } catch (Exception e) {
            // Silence deserialization errors
        }
        
        if (item != null) {
            item.setQuantity(item.getQuantity() + request.getQuantity());
            item.setName(product.getName());
            item.setUnitPrice(product.getPrice());
            item.setOriginalPrice(product.getOriginalPrice());
            item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            item.setStockQuantity(product.getStockQuantity());
        } else {
            item = CartItemDto.builder()
                .medicineId(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .imageUrl(product.getPrimaryImageUrl())
                .unit(product.getPackingUnit() != null ? product.getPackingUnit().split(" ")[0] : "Hộp")
                .quantity(request.getQuantity())
                .unitPrice(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())))
                .stockQuantity(product.getStockQuantity())
                .build();
        }
        
        redisTemplate.opsForHash().put(key, hashKey, item);
        redisTemplate.expire(key, CART_TTL_DAYS, TimeUnit.DAYS);
    }

    public CartDto getCart(String cartId) {
        String key = CART_PREFIX + cartId;
        Map<Object, Object> itemsMap = redisTemplate.opsForHash().entries(key);
        
        var items = itemsMap.values().stream()
                .map(obj -> (CartItemDto) obj)
                .peek(item -> {
                    // Update stock quantity in real-time
                    try {
                        ProductClient.ProductDto product = productClient.getProductById(item.getMedicineId());
                        if (product != null) {
                            item.setStockQuantity(product.getStockQuantity());
                        }
                    } catch (Exception e) {
                        // Keep old value or set null on error
                    }
                })
                .collect(Collectors.toList());
        
        BigDecimal totalAmount = items.stream()
                .map(CartItemDto::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        return CartDto.builder()
                .cartId(cartId)
                .items(items)
                .totalAmount(totalAmount)
                .build();
    }

    public void updateItemQuantity(String cartId, Long medicineId, int quantity) {
        String key = CART_PREFIX + cartId;
        String hashKey = String.valueOf(medicineId);
        CartItemDto item = (CartItemDto) redisTemplate.opsForHash().get(key, hashKey);
        
        if (item != null) {
            if (quantity <= 0) {
                removeItem(cartId, medicineId);
            } else {
                item.setQuantity(quantity);
                item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
                redisTemplate.opsForHash().put(key, String.valueOf(medicineId), item);
            }
        }
    }

    public void removeItem(String cartId, Long medicineId) {
        String key = CART_PREFIX + cartId;
        String hashKey = String.valueOf(medicineId);
        
        redisTemplate.opsForHash().delete(key, hashKey);
    }

    public void clearCart(String cartId) {
        String key = CART_PREFIX + cartId;
        redisTemplate.delete(key);
    }

    public void mergeCart(String guestCartId, String userCartId) {
        CartDto guestCart = getCart(guestCartId);
        if (guestCart.getItems() != null) {
            for (CartItemDto item : guestCart.getItems()) {
                addItemToCart(userCartId, new CartItemRequest() {{
                    setMedicineId(item.getMedicineId());
                    setQuantity(item.getQuantity());
                }});
            }
        }
        clearCart(guestCartId);
    }
}
