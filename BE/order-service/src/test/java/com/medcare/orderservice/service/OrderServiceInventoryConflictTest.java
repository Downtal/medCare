package com.medcare.orderservice.service;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.orderservice.client.InventoryClient;
import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.client.PromotionClient;
import com.medcare.orderservice.client.ShippingClient;
import com.medcare.orderservice.client.UserClient;
import com.medcare.orderservice.dto.OrderItemRequest;
import com.medcare.orderservice.dto.OrderRequest;
import com.medcare.orderservice.entity.PaymentMethod;
import com.medcare.orderservice.repository.OrderRepository;
import com.medcare.orderservice.repository.OrderStatusLogRepository;
import com.medcare.orderservice.service.strategy.OrderProcessingStrategy;
import com.medcare.orderservice.service.strategy.OrderStrategyFactory;
import feign.FeignException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceInventoryConflictTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartService cartService;
    @Mock private ProductClient productClient;
    @Mock private PromotionClient promotionClient;
    @Mock private ShippingClient shippingClient;
    @Mock private InventoryClient inventoryClient;
    @Mock private OrderStrategyFactory strategyFactory;
    @Mock private OrderStatusLogRepository statusLogRepository;
    @Mock private UserClient userClient;
    @Mock private OrderProcessingStrategy orderStrategy;

    @InjectMocks private OrderService orderService;

    private OrderRequest request;

    @BeforeEach
    void setUp() {
        request = new OrderRequest();
        request.setRecipientName("Test User");
        request.setRecipientPhone("0900000000");
        request.setStreet("123 Test Street");
        request.setWard("Ward 1");
        request.setDistrict("District 1");
        request.setProvince("HCM");
        request.setCityId(1);
        request.setDistrictId(2);
        request.setWardCode("00123");
        request.setPaymentMethod(PaymentMethod.COD);
        request.setDiscountAmount(BigDecimal.ZERO);
    }

    @Test
    void shouldThrowInventoryConflictWhenInventoryServiceReturnsConflictCode3003() {
        request.setItems(List.of(OrderItemRequest.builder()
                .medicineId(1L)
                .quantity(1)
                .unit("hop")
                .build()));

        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(1L);
        product.setName("Paracetamol");
        product.setPrice(BigDecimal.valueOf(20000));
        product.setPrimaryImageUrl("img");
        product.setRequiresPrescription(false);

        FeignException feignException = mock(FeignException.class);
        when(feignException.status()).thenReturn(409);
        when(feignException.contentUTF8()).thenReturn("{\"errorCode\":\"3003\"}");
        when(feignException.getMessage()).thenReturn("Inventory conflict");

        when(productClient.getProductById(1L)).thenReturn(product);
        doThrow(feignException).when(inventoryClient).deductStock(any());

        AppException exception = assertThrows(AppException.class, () -> orderService.createOrder("1", request));
        assertEquals(ErrorCode.INVENTORY_CONFLICT, exception.getErrorCode());
        verify(orderRepository, never()).save(any());
    }
}
