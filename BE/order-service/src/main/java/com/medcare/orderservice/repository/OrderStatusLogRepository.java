package com.medcare.orderservice.repository;

import com.medcare.orderservice.entity.OrderStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderStatusLogRepository extends JpaRepository<OrderStatusLog, Long> {
    List<OrderStatusLog> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
