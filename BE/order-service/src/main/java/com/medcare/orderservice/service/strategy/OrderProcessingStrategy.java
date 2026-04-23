package com.medcare.orderservice.service.strategy;

import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.OrderType;

public interface OrderProcessingStrategy {
    void process(Order order);
    OrderType getSupportedType();
}
