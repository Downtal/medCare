package com.medcare.orderservice.service.strategy;

import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.OrderStatus;
import com.medcare.orderservice.entity.OrderType;
import org.springframework.stereotype.Component;

@Component
public class PrescriptionOrderStrategy implements OrderProcessingStrategy {
    
    @Override
    public void process(Order order) {
        // Prescriptions are now verified BEFORE order creation in OrderService
        // No need for a separate review status after order is placed
        order.setStatus(OrderStatus.PENDING);
        
        // Mock AI Extraction logic if imageUrl exists
        if (order.getPrescriptionImageUrl() != null) {
            order.setExtractedInfo("{\"ai_analysis\": \"Dự đoán đơn thuốc kháng sinh, cần kiểm tra kỹ liều lượng\"}");
        }
    }

    @Override
    public OrderType getSupportedType() {
        return OrderType.PRESCRIPTION;
    }
}
