package com.medcare.orderservice.repository;

import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.OrderStatus;
import com.medcare.orderservice.repository.projection.MedicinePopularityProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    List<Order> findByUserIdAndCreatedAtAfterAndDeletedAtIsNull(Long userId, java.time.LocalDateTime since);
    Optional<Order> findByOrderCode(String orderCode);
    Optional<Order> findByOrderCodeAndDeletedAtIsNull(String orderCode);
    List<Order> findAllByDeletedAtIsNull();
    List<Order> findAllByDeletedAtIsNotNull();
    List<Order> findByPrescriptionIdAndStatusIn(Long prescriptionId, List<OrderStatus> statuses);

    @Query(value = "SELECT * FROM `orders` WHERE deleted_at IS NULL", nativeQuery = true)
    List<Order> findAllRaw();

    List<Order> findByStatusAndCreatedAtBeforeAndDeletedAtIsNull(com.medcare.orderservice.entity.OrderStatus status, java.time.LocalDateTime before);

    List<Order> findByUserIdAndStatusInAndCreatedAtAfterAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long userId,
            List<OrderStatus> statuses,
            LocalDateTime since
    );

    @Query("""
            SELECT oi.medicineId AS medicineId, COALESCE(SUM(oi.quantity), 0) AS popularity
            FROM Order o
            JOIN o.items oi
            WHERE o.deletedAt IS NULL
              AND o.status IN :statuses
              AND o.createdAt >= :since
            GROUP BY oi.medicineId
            ORDER BY COALESCE(SUM(oi.quantity), 0) DESC, oi.medicineId ASC
            """)
    List<MedicinePopularityProjection> findMedicinePopularitySince(
            @Param("statuses") List<OrderStatus> statuses,
            @Param("since") LocalDateTime since
    );
}
