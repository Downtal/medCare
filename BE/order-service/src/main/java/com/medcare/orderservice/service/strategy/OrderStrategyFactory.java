package com.medcare.orderservice.service.strategy;

import com.medcare.orderservice.entity.OrderType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OrderStrategyFactory {
    
    private final Map<OrderType, OrderProcessingStrategy> strategies;

    public OrderStrategyFactory(List<OrderProcessingStrategy> strategyList) {
        strategies = strategyList.stream()
                .collect(Collectors.toMap(OrderProcessingStrategy::getSupportedType, Function.identity()));
    }

    public OrderProcessingStrategy getStrategy(OrderType type) {
        OrderProcessingStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("No strategy found for order type: " + type);
        }
        return strategy;
    }
}
