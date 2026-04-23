package com.medcare.orderservice.service.strategy;

import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.OrderStatus;
import com.medcare.orderservice.entity.OrderType;
import org.springframework.stereotype.Component;

@Component
public class OtcOrderStrategy implements OrderProcessingStrategy {
    
    @Override
    public void process(Order order) {
        // Business logic for OTC: directly move to PENDING_PAYMENT
        order.setStatus(OrderStatus.PENDING);
    }

    @Override
    public OrderType getSupportedType() {
        return OrderType.OTC;
    }
}
