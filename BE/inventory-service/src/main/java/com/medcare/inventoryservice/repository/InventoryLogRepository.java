package com.medcare.inventoryservice.repository;

import com.medcare.inventoryservice.entity.InventoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    List<InventoryLog> findAllByOrderByCreatedAtDesc();
    List<InventoryLog> findByReferenceIdAndChangeType(String referenceId, com.medcare.inventoryservice.entity.InventoryChangeType changeType);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
