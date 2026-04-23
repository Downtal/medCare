package com.medcare.promotionservice.strategy;

import com.medcare.promotionservice.entity.DiscountType;
import com.medcare.promotionservice.entity.Voucher;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PercentageStrategy implements DiscountStrategy {
    @Override
    public BigDecimal calculateDiscount(BigDecimal amount, Voucher voucher) {
        BigDecimal discount = amount.multiply(voucher.getDiscountValue())
                .divide(new BigDecimal("100"), RoundingMode.HALF_UP);
        
        // Cap at maxDiscount if defined
        if (voucher.getMaxDiscount() != null && voucher.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
            return discount.min(voucher.getMaxDiscount());
        }
        return discount;
    }

    @Override
    public DiscountType getSupportedType() {
        return DiscountType.PERCENT;
    }
}
