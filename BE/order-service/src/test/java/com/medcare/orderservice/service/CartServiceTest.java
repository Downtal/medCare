package com.medcare.orderservice.service;

import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemDto;
import com.medcare.orderservice.dto.CartItemRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private HashOperations<String, Object, Object> hashOperations;
    @Mock private ProductClient productClient;

    @InjectMocks private CartService cartService;

    @Test
    void shouldAddItemToCartSuccessfully() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        String cartId = "user:1";
        CartItemRequest request = new CartItemRequest();
        request.setMedicineId(1L);
        request.setQuantity(2);

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setName("Paracetamol");
        product.setPrice(BigDecimal.valueOf(50000));
        product.setStockQuantity(100);

        when(productClient.getProductById(1L)).thenReturn(product);
        when(hashOperations.get(anyString(), anyString())).thenReturn(null);

        // When
        cartService.addItemToCart(cartId, request);

        // Then
        verify(hashOperations).put(eq("cart:" + cartId), eq("1"), any(CartItemDto.class));
    }

    @Test
    void shouldMergeQuantityWhenItemAlreadyInCart() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        String cartId = "user:1";
        CartItemRequest request = new CartItemRequest();
        request.setMedicineId(1L);
        request.setQuantity(3);

        CartItemDto existing = CartItemDto.builder()
                .medicineId(1L)
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(50000))
                .totalPrice(BigDecimal.valueOf(100000))
                .build();

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setName("Paracetamol");
        product.setPrice(BigDecimal.valueOf(50000));
        product.setStockQuantity(100);

        when(productClient.getProductById(1L)).thenReturn(product);
        when(hashOperations.get(anyString(), anyString())).thenReturn(existing);

        // When
        cartService.addItemToCart(cartId, request);

        // Then: should save with quantity 5 (2+3)
        verify(hashOperations).put(eq("cart:" + cartId), eq("1"), any(CartItemDto.class));
        assertEquals(5, existing.getQuantity());
    }

    @Test
    void shouldThrowExceptionWhenProductOutOfStock() {
        // Given
        String cartId = "user:1";
        CartItemRequest request = new CartItemRequest();
        request.setMedicineId(1L);
        request.setQuantity(1);

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setStockQuantity(0);

        when(productClient.getProductById(1L)).thenReturn(product);

        // When & Then
        assertThrows(RuntimeException.class, () -> cartService.addItemToCart(cartId, request));
    }

    @Test
    void shouldReturnEmptyCartWhenKeyNotExists() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        when(hashOperations.entries(anyString())).thenReturn(new HashMap<>());

        // When
        CartDto result = cartService.getCart("user:unknown");

        // Then
        assertNotNull(result);
        assertTrue(result.getItems().isEmpty());
        assertEquals(BigDecimal.ZERO, result.getTotalAmount());
    }

    @Test
    void shouldRemoveItemFromCartSuccessfully() {
        // When
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        cartService.removeItem("user:1", 1L);

        // Then
        verify(hashOperations).delete("cart:user:1", "1");
    }

    @Test
    void shouldClearAllItemsFromCart() {
        // When
        cartService.clearCart("user:1");

        // Then
        verify(redisTemplate).delete("cart:user:1");
    }

    @Test
    void shouldCalculateTotalAmountWhenGettingCart() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        CartItemDto item1 = CartItemDto.builder()
                .medicineId(1L)
                .totalPrice(BigDecimal.valueOf(100000))
                .build();
        CartItemDto item2 = CartItemDto.builder()
                .medicineId(2L)
                .totalPrice(BigDecimal.valueOf(50000))
                .build();

        Map<Object, Object> entries = new HashMap<>();
        entries.put("1", item1);
        entries.put("2", item2);
        when(hashOperations.entries(anyString())).thenReturn(entries);

        // When
        CartDto result = cartService.getCart("user:1");

        // Then
        assertNotNull(result);
        assertEquals(2, result.getItems().size());
        assertEquals(BigDecimal.valueOf(150000), result.getTotalAmount());
    }

    @Test
    void shouldRecoverLegacyItemAndRewriteWhenGettingCart() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        Map<String, Object> legacy = new LinkedHashMap<>();
        legacy.put("medicineId", 1L);
        legacy.put("name", "Paracetamol");
        legacy.put("quantity", 2);
        legacy.put("unitPrice", BigDecimal.valueOf(50000));
        legacy.put("totalPrice", BigDecimal.valueOf(100000));

        Map<Object, Object> entries = new HashMap<>();
        entries.put("1", legacy);
        when(hashOperations.entries("cart:user:legacy")).thenReturn(entries);

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setStockQuantity(88);
        when(productClient.getProductById(1L)).thenReturn(product);

        // When
        CartDto result = cartService.getCart("user:legacy");

        // Then
        assertEquals(1, result.getItems().size());
        assertEquals(1L, result.getItems().get(0).getMedicineId());
        assertEquals(88, result.getItems().get(0).getStockQuantity());
        verify(hashOperations).put(eq("cart:user:legacy"), eq("1"), any(CartItemDto.class));
    }

    @Test
    void shouldSkipCorruptedEntryAndKeepValidEntries() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);

        CartItemDto valid = CartItemDto.builder()
                .medicineId(1L)
                .quantity(1)
                .totalPrice(BigDecimal.valueOf(10000))
                .build();

        Map<Object, Object> entries = new HashMap<>();
        entries.put("1", valid);
        entries.put("2", "broken-serialized-value");
        when(hashOperations.entries("cart:user:broken")).thenReturn(entries);

        // When
        CartDto result = cartService.getCart("user:broken");

        // Then
        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertEquals(BigDecimal.valueOf(10000), result.getTotalAmount());
        verify(hashOperations, never()).put(eq("cart:user:broken"), eq("2"), any());
    }

    @Test
    void shouldMergeQuantityFromLegacyEntryWhenAddingItem() {
        // Given
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        String cartId = "user:legacy-add";

        CartItemRequest request = new CartItemRequest();
        request.setMedicineId(1L);
        request.setQuantity(3);

        Map<String, Object> legacy = new LinkedHashMap<>();
        legacy.put("medicineId", 1L);
        legacy.put("name", "Paracetamol");
        legacy.put("quantity", 2);
        legacy.put("unitPrice", BigDecimal.valueOf(50000));
        legacy.put("totalPrice", BigDecimal.valueOf(100000));
        when(hashOperations.get("cart:" + cartId, "1")).thenReturn(legacy);

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setName("Paracetamol");
        product.setPrice(BigDecimal.valueOf(50000));
        product.setOriginalPrice(BigDecimal.valueOf(60000));
        product.setStockQuantity(100);
        when(productClient.getProductById(1L)).thenReturn(product);

        ArgumentCaptor<CartItemDto> captor = ArgumentCaptor.forClass(CartItemDto.class);

        // When
        cartService.addItemToCart(cartId, request);

        // Then
        verify(hashOperations, atLeast(1)).put(eq("cart:" + cartId), eq("1"), captor.capture());
        List<CartItemDto> captured = captor.getAllValues();
        CartItemDto latest = captured.get(captured.size() - 1);
        assertEquals(5, latest.getQuantity());
        assertEquals(BigDecimal.valueOf(250000), latest.getTotalPrice());
    }
}
