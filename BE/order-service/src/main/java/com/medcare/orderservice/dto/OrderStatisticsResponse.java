package com.medcare.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatisticsResponse {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private BigDecimal averageOrderValue;
    private long pendingOrders;
    private long shippingOrders;
    private long completedOrders;
    
    private double revenueGrowth;
    private double ordersGrowth;
    private double aovGrowth;
    private double completionGrowth;
    
    private List<RevenueByPeriod> revenueTrend;
    private List<TopProduct> topProducts;
    private Map<String, Long> paymentMethodDistribution;

    @Data
    @AllArgsConstructor
    public static class RevenueByPeriod {
        private String period; // Date string or Week string
        private BigDecimal revenue;
        private long orderCount;
    }

    @Data
    @AllArgsConstructor
    public static class TopProduct {
        private Long productId;
        private String productName;
        private long quantitySold;
        private BigDecimal totalRevenue;
    }
}
