package com.medcare.common.util;

import lombok.experimental.UtilityClass;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

@UtilityClass
public class CurrencyUtils {

    private static final DecimalFormat VND_FORMAT;

    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.getDefault());
        symbols.setGroupingSeparator('.');
        VND_FORMAT = new DecimalFormat("#,###", symbols);
    }

    /**
     * Format a number to VND string. Example: 150000 → "150.000 ₫"
     */
    public static String formatVnd(long amount) {
        return VND_FORMAT.format(amount) + " ₫";
    }

    /**
     * Format a number to VND string without the currency symbol. Example: 150000 → "150.000"
     */
    public static String formatVndRaw(long amount) {
        return VND_FORMAT.format(amount);
    }

    /**
     * Calculate discount amount from original price and percentage.
     * Example: 100000, 10 → 10000
     */
    public static long calcDiscountAmount(long originalPrice, int discountPercent) {
        return originalPrice * discountPercent / 100L;
    }

    /**
     * Calculate final price after discount.
     */
    public static long applyDiscount(long originalPrice, int discountPercent) {
        return originalPrice - calcDiscountAmount(originalPrice, discountPercent);
    }
}
