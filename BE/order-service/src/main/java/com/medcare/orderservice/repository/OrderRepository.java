package com.medcare.orderservice.repository;

import com.medcare.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    Optional<Order> findByOrderCode(String orderCode);
    Optional<Order> findByOrderCodeAndDeletedAtIsNull(String orderCode);
    List<Order> findAllByDeletedAtIsNull();
    List<Order> findAllByDeletedAtIsNotNull();

    @Query(value = "SELECT * FROM `orders` WHERE deleted_at IS NULL", nativeQuery = true)
    List<Order> findAllRaw();
}
