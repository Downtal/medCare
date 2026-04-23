package com.medcare.orderservice.service.strategy;

import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.OrderStatus;
import com.medcare.orderservice.entity.OrderType;
import org.springframework.stereotype.Component;

@Component
public class PrescriptionOrderStrategy implements OrderProcessingStrategy {
    
    @Override
    public void process(Order order) {
        // Business logic for Prescription: requires Pharmacist review
        order.setStatus(OrderStatus.PENDING_PRESCRIPTION);
        
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
