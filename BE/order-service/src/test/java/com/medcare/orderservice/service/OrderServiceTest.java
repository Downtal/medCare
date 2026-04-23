package com.medcare.orderservice.service;

import com.medcare.orderservice.client.InventoryClient;
import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.client.PromotionClient;
import com.medcare.orderservice.client.ShippingClient;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemDto;
import com.medcare.orderservice.dto.OrderItemRequest;
import com.medcare.orderservice.dto.OrderRequest;
import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.PaymentMethod;
import com.medcare.orderservice.repository.OrderRepository;
import com.medcare.orderservice.service.strategy.OrderStrategyFactory;
import com.medcare.orderservice.service.strategy.OrderProcessingStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartService cartService;
    @Mock private ProductClient productClient;
    @Mock private PromotionClient promotionClient;
    @Mock private ShippingClient shippingClient;
    @Mock private InventoryClient inventoryClient;
    @Mock private OrderStrategyFactory strategyFactory;
    @Mock private OrderProcessingStrategy orderStrategy;

    @InjectMocks private OrderService orderService;

    private OrderRequest request;
    private final String userId = "1";

    @BeforeEach
    void setUp() {
        request = new OrderRequest();
        request.setRecipientName("Test User");
        request.setRecipientPhone("0987654321");
        request.setStreet("123 Street");
        request.setWard("Ward 1");
        request.setDistrict("District 1");
        request.setProvince("City 1");
        request.setPaymentMethod(PaymentMethod.COD);
        request.setDiscountAmount(BigDecimal.ZERO);
    }

    @Test
    void shouldCreateOrderSuccessfullyWhenItemsProvidedInRequest() {
        // Given
        OrderItemRequest item = new OrderItemRequest(1L, 2, "hộp");
        request.setItems(List.of(item));

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setName("Product 1");
        product.setPrice(BigDecimal.valueOf(50000));
        product.setPrimaryImageUrl("url");
        product.setRequiresPrescription(false);

        when(productClient.getProductById(1L)).thenReturn(product);
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);
        when(strategyFactory.getStrategy(any())).thenReturn(orderStrategy);

        // When
        Order result = orderService.createOrder(userId, request);

        // Then
        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(100000), result.getTotalPrice());
        assertEquals(BigDecimal.valueOf(130000), result.getGrandTotal()); // 100k + 30k shipping
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void shouldFallbackToCartWhenNoItemsInRequest() {
        // Given
        request.setItems(null);
        CartDto cart = new CartDto();
        CartItemDto cartItem = new CartItemDto();
        cartItem.setMedicineId(1L);
        cartItem.setQuantity(2);
        cart.setItems(List.of(cartItem));
        cart.setTotalAmount(BigDecimal.valueOf(100000));

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setPrice(BigDecimal.valueOf(50000));
        product.setRequiresPrescription(false);

        when(cartService.getCart("user:" + userId)).thenReturn(cart);
        when(productClient.getProductById(anyLong())).thenReturn(product);
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);
        when(strategyFactory.getStrategy(any())).thenReturn(orderStrategy);

        // When
        Order result = orderService.createOrder(userId, request);

        // Then
        assertNotNull(result);
        verify(cartService).getCart("user:" + userId);
        assertEquals(BigDecimal.valueOf(100000), result.getTotalPrice());
    }

    @Test
    void shouldThrowExceptionWhenCartIsEmpty() {
        // Given
        request.setItems(null);
        CartDto cart = new CartDto();
        cart.setItems(List.of());

        when(cartService.getCart("user:" + userId)).thenReturn(cart);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> orderService.createOrder(userId, request));
        assertEquals("Giỏ hàng đang trống", exception.getMessage());
    }

    @Test
    void shouldApplyDiscountWhenVoucherProvided() {
        // Given
        OrderItemRequest item = new OrderItemRequest(1L, 1, "hộp");
        request.setItems(List.of(item));
        request.setVoucherCode("SAVE10");
        request.setDiscountAmount(BigDecimal.valueOf(10000));

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setPrice(BigDecimal.valueOf(50000));
        product.setRequiresPrescription(false);

        when(productClient.getProductById(1L)).thenReturn(product);
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);
        when(strategyFactory.getStrategy(any())).thenReturn(orderStrategy);

        // When
        Order result = orderService.createOrder(userId, request);

        // Then
        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(50000), result.getTotalPrice());
        assertEquals(BigDecimal.valueOf(70000), result.getGrandTotal()); // 50k + 30k - 10k
        assertEquals(BigDecimal.valueOf(10000), result.getDiscountAmount());
    }
}
