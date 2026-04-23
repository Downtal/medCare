package com.medcare.promotionservice.strategy;

import com.medcare.promotionservice.entity.DiscountType;
import com.medcare.promotionservice.entity.Voucher;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FixedAmountStrategy implements DiscountStrategy {
    @Override
    public BigDecimal calculateDiscount(BigDecimal amount, Voucher voucher) {
        // Can't discount more than the order value
        return amount.min(voucher.getDiscountValue());
    }

    @Override
    public DiscountType getSupportedType() {
        return DiscountType.FIXED;
    }
}
