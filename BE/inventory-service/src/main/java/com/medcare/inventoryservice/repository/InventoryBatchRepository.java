package com.medcare.inventoryservice.repository;

import com.medcare.inventoryservice.dto.ProductStockSummary;
import com.medcare.inventoryservice.entity.InventoryBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    List<InventoryBatch> findByMedicineId(Long medicineId);
    boolean existsByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);
    void deleteByMedicineId(Long medicineId);
    
    @Query("SELECT SUM(ib.quantityAvailable - ib.quantityReserved) FROM InventoryBatch ib WHERE ib.medicineId = :medicineId")
    Integer getTotalAvailableQuantity(Long medicineId);

    List<InventoryBatch> findByMedicineIdOrderByExpiryDateAscIdAsc(Long medicineId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ib FROM InventoryBatch ib " +
            "WHERE ib.medicineId = :medicineId " +
            "AND ib.status = com.medcare.inventoryservice.entity.InventoryBatch.BatchStatus.ACTIVE " +
            "AND (ib.quantityAvailable - ib.quantityReserved) > 0 " +
            "ORDER BY ib.expiryDate ASC, ib.id ASC")
    List<InventoryBatch> findActiveBatchesForDeductWithLock(@Param("medicineId") Long medicineId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ib FROM InventoryBatch ib WHERE ib.id = :id")
    java.util.Optional<InventoryBatch> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT new com.medcare.inventoryservice.dto.ProductStockSummary(" +
           "ib.medicineId, ib.medicineName, ib.medicineSlug, ib.medicineImage, " +
           "ib.brand, ib.registrationNumber, ib.countryOfOrigin, " +
           "SUM(CAST(ib.quantityAvailable AS long)), SUM(CAST(ib.quantityReserved AS long)), COUNT(ib)) " +
           "FROM InventoryBatch ib " +
           "GROUP BY ib.medicineId, ib.medicineName, ib.medicineSlug, ib.medicineImage, ib.brand, ib.registrationNumber, ib.countryOfOrigin " +
           "ORDER BY ib.medicineName ASC")
    List<ProductStockSummary> findProductStockSummaries();

    @Query("SELECT new com.medcare.inventoryservice.dto.ProductStockSummary(" +
           "ib.medicineId, ib.medicineName, ib.medicineSlug, ib.medicineImage, " +
           "ib.brand, ib.registrationNumber, ib.countryOfOrigin, " +
           "SUM(CAST(ib.quantityAvailable AS long)), SUM(CAST(ib.quantityReserved AS long)), COUNT(ib)) " +
           "FROM InventoryBatch ib " +
           "GROUP BY ib.medicineId, ib.medicineName, ib.medicineSlug, ib.medicineImage, ib.brand, ib.registrationNumber, ib.countryOfOrigin " +
           "HAVING SUM(CAST(ib.quantityAvailable AS long)) < :threshold " +
           "ORDER BY SUM(CAST(ib.quantityAvailable AS long)) ASC")
    List<ProductStockSummary> findLowStockSummaries(long threshold);
}
