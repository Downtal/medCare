package com.medcare.orderservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.orderservice.client.InventoryClient;
import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemDto;
import com.medcare.orderservice.dto.CartItemRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class CartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;
    private static final String CART_PREFIX = "cart:";
    private static final long CART_TTL_DAYS = 7;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CartService(
            @Qualifier("cartRedisTemplate") RedisTemplate<String, Object> redisTemplate,
            ProductClient productClient,
            InventoryClient inventoryClient
    ) {
        this.redisTemplate = redisTemplate;
        this.productClient = productClient;
        this.inventoryClient = inventoryClient;
    }

    public void addItemToCart(String cartId, CartItemRequest request) {
        String key = CART_PREFIX + cartId;
        
        // Securely fetch current product info
        ProductClient.ProductDto product = productClient.getProductById(request.getMedicineId());
        if (product == null) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        // Fetch real-time stock from inventory-service
        Integer realStock = null;
        try {
            realStock = inventoryClient.getTotalStock(request.getMedicineId());
        } catch (Exception e) {
            log.warn("Failed to fetch real-time stock from inventory-service. fallback=product-service-stock, reason={}", e.getClass().getSimpleName());
            realStock = product.getStockQuantity();
        }

        // Check stock before adding
        if (realStock != null && realStock <= 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Sản phẩm hiện đang hết hàng.");
        }

        // Convert Request to DTO for storage
        String hashKey = String.valueOf(request.getMedicineId());
        CartItemDto item = readCartItem(key, hashKey, true).orElse(null);
        
        if (item != null) {
            int currentQuantity = item.getQuantity() == null ? 0 : item.getQuantity();
            item.setQuantity(currentQuantity + request.getQuantity());
            item.setName(product.getName());
            item.setUnitPrice(product.getPrice());
            item.setOriginalPrice(product.getOriginalPrice());
            item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            item.setStockQuantity(realStock);
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
                .stockQuantity(realStock)
                .build();
        }
        
        redisTemplate.opsForHash().put(key, hashKey, item);
        redisTemplate.expire(key, CART_TTL_DAYS, TimeUnit.DAYS);
    }

    public CartDto getCart(String cartId) {
        String key = CART_PREFIX + cartId;
        Map<Object, Object> itemsMap;
        try {
            itemsMap = redisTemplate.opsForHash().entries(key);
        } catch (Exception e) {
            log.warn("Failed to read cart hash entries. cartKey={}, action=return-empty, reason={}",
                    key, e.getClass().getSimpleName());
            return CartDto.builder()
                    .cartId(cartId)
                    .items(new ArrayList<>())
                    .totalAmount(BigDecimal.ZERO)
                    .build();
        }

        var items = new ArrayList<CartItemDto>();
        for (Map.Entry<Object, Object> entry : itemsMap.entrySet()) {
            String hashKey = String.valueOf(entry.getKey());
            Optional<CartItemDto> normalized = normalizeCartItem(key, hashKey, entry.getValue(), true);
            if (normalized.isEmpty()) {
                continue;
            }
            CartItemDto item = normalized.get();
            // Update stock quantity in real-time
            try {
                Integer realStock = inventoryClient.getTotalStock(item.getMedicineId());
                if (realStock != null) {
                    item.setStockQuantity(realStock);
                }
            } catch (Exception e) {
                log.debug("Failed to refresh stock from inventory-service. medicineId={}, cartKey={}, reason={}",
                        item.getMedicineId(), key, e.getClass().getSimpleName());
            }
            items.add(item);
        }

        BigDecimal totalAmount = items.stream()
                .map(CartItemDto::getTotalPrice)
                .filter(total -> total != null)
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
        CartItemDto item = readCartItem(key, hashKey, true).orElse(null);
        
        if (item != null) {
            if (quantity <= 0) {
                removeItem(cartId, medicineId);
            } else {
                item.setQuantity(quantity);
                if (item.getUnitPrice() != null) {
                    item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
                }
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

    private Optional<CartItemDto> readCartItem(String key, String hashKey, boolean rewriteOnRecovery) {
        Object rawItem;
        try {
            rawItem = redisTemplate.opsForHash().get(key, hashKey);
        } catch (Exception e) {
            log.warn("Failed to read cart entry. cartKey={}, hashKey={}, action=skip, reason={}",
                    key, hashKey, e.getClass().getSimpleName());
            return Optional.empty();
        }
        return normalizeCartItem(key, hashKey, rawItem, rewriteOnRecovery);
    }

    private Optional<CartItemDto> normalizeCartItem(String key, String hashKey, Object rawItem, boolean rewriteOnRecovery) {
        if (rawItem == null) {
            return Optional.empty();
        }
        if (rawItem instanceof CartItemDto cartItemDto) {
            return Optional.of(cartItemDto);
        }

        try {
            CartItemDto converted = objectMapper.convertValue(rawItem, CartItemDto.class);
            if (converted == null || converted.getMedicineId() == null) {
                log.warn("Invalid legacy cart entry. cartKey={}, hashKey={}, action=skip", key, hashKey);
                return Optional.empty();
            }

            if (rewriteOnRecovery) {
                redisTemplate.opsForHash().put(key, hashKey, converted);
                log.info("Rewrote cart entry to normalized format. cartKey={}, hashKey={}", key, hashKey);
            }
            return Optional.of(converted);
        } catch (Exception e) {
            log.warn("Failed to deserialize cart entry. cartKey={}, hashKey={}, action=skip, reason={}",
                    key, hashKey, e.getClass().getSimpleName());
            return Optional.empty();
        }
    }
}
