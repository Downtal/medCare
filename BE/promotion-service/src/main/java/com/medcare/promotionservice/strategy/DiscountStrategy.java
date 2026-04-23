package com.medcare.promotionservice.strategy;

import com.medcare.promotionservice.entity.DiscountType;
import com.medcare.promotionservice.entity.Voucher;

import java.math.BigDecimal;

public interface DiscountStrategy {
    BigDecimal calculateDiscount(BigDecimal amount, Voucher voucher);
    DiscountType getSupportedType();
}
