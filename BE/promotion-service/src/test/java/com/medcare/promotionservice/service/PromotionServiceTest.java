package com.medcare.promotionservice.service;

import com.medcare.promotionservice.dto.VoucherApplyRequest;
import com.medcare.promotionservice.dto.VoucherApplyResponse;
import com.medcare.promotionservice.entity.DiscountType;
import com.medcare.promotionservice.entity.Voucher;
import com.medcare.promotionservice.repository.UserVoucherRepository;
import com.medcare.promotionservice.repository.VoucherRepository;
import com.medcare.promotionservice.repository.VoucherUsageRepository;
import com.medcare.promotionservice.strategy.DiscountStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {

    @Mock private VoucherRepository voucherRepository;
    @Mock private VoucherUsageRepository voucherUsageRepository;
    @Mock private UserVoucherRepository userVoucherRepository;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    @Spy private List<DiscountStrategy> discountStrategies = new ArrayList<>();
    @Mock private DiscountStrategy discountStrategy;

    @InjectMocks private PromotionService promotionService;

    @BeforeEach
    void setUp() {
        discountStrategies.add(discountStrategy);
    }

    private VoucherApplyRequest buildRequest(String code, BigDecimal price, int qty) {
        VoucherApplyRequest request = new VoucherApplyRequest();
        request.setCode(code);
        request.setUserId(1L);
        VoucherApplyRequest.OrderItemDto item = new VoucherApplyRequest.OrderItemDto();
        item.setPrice(price);
        item.setQuantity(qty);
        item.setPrescription(false);
        request.setItems(List.of(item));
        return request;
    }

    private Voucher buildActiveVoucher(String code, DiscountType type, BigDecimal value) {
        Voucher v = new Voucher();
        v.setId(1L);
        v.setCode(code);
        v.setDiscountType(type);
        v.setDiscountValue(value);
        v.setUsageLimit(100);
        v.setUsedCount(0);
        v.setLimitPerUser(5);
        v.setMinOrderValue(BigDecimal.valueOf(50000));
        v.setActive(true);
        return v;
    }

    @Test
    void shouldApplyVoucherSuccessfully() {
        // Given
        VoucherApplyRequest request = buildRequest("SAVE10", BigDecimal.valueOf(100000), 1);
        Voucher voucher = buildActiveVoucher("SAVE10", DiscountType.FIXED, BigDecimal.valueOf(10000));

        when(voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull("SAVE10")).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 1L)).thenReturn(0L);
        when(redisTemplate.hasKey(anyString())).thenReturn(true);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("90");

        when(discountStrategy.getSupportedType()).thenReturn(DiscountType.FIXED);
        when(discountStrategy.calculateDiscount(any(), any())).thenReturn(BigDecimal.valueOf(10000));

        // When
        VoucherApplyResponse response = promotionService.applyVoucher(request);

        // Then
        assertTrue(response.isSuccess());
        assertEquals(BigDecimal.valueOf(10000), response.getDiscountAmount());
        assertEquals(BigDecimal.valueOf(90000), response.getFinalTotal());
    }

    @Test
    void shouldThrowExceptionWhenVoucherNotFound() {
        // Given
        VoucherApplyRequest request = buildRequest("FAKE", BigDecimal.valueOf(100000), 1);
        when(voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull("FAKE")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> promotionService.applyVoucher(request));
    }

    @Test
    void shouldThrowExceptionWhenVoucherExpired() {
        // Given
        VoucherApplyRequest request = buildRequest("EXPIRED", BigDecimal.valueOf(100000), 1);
        Voucher expired = buildActiveVoucher("EXPIRED", DiscountType.FIXED, BigDecimal.valueOf(10000));
        expired.setEndAt(LocalDateTime.now().minusDays(1));

        when(voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull("EXPIRED")).thenReturn(Optional.of(expired));

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, () -> promotionService.applyVoucher(request));
        assertEquals("Mã giảm giá đã hết hạn", ex.getMessage());
    }

    @Test
    void shouldThrowExceptionWhenUserLimitReached() {
        // Given
        VoucherApplyRequest request = buildRequest("USED", BigDecimal.valueOf(100000), 1);
        Voucher voucher = buildActiveVoucher("USED", DiscountType.FIXED, BigDecimal.valueOf(10000));
        voucher.setLimitPerUser(1);

        when(voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull("USED")).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 1L)).thenReturn(1L);

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, () -> promotionService.applyVoucher(request));
        assertEquals("Bạn đã hết lượt sử dụng mã này", ex.getMessage());
    }

    @Test
    void shouldThrowWhenOrderBelowMinimumValue() {
        // Given: order total 10k, min order 50k
        VoucherApplyRequest request = buildRequest("MIN50K", BigDecimal.valueOf(10000), 1);
        Voucher voucher = buildActiveVoucher("MIN50K", DiscountType.FIXED, BigDecimal.valueOf(5000));
        voucher.setMinOrderValue(BigDecimal.valueOf(50000));

        when(voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull("MIN50K")).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.countByVoucherIdAndUserId(any(), any())).thenReturn(0L);

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, () -> promotionService.applyVoucher(request));
        assertTrue(ex.getMessage().contains("tối thiểu"));
    }
}
