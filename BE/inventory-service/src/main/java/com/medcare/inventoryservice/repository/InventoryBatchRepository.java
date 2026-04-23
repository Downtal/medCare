package com.medcare.inventoryservice.repository;

import com.medcare.inventoryservice.dto.ProductStockSummary;
import com.medcare.inventoryservice.entity.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    List<InventoryBatch> findByMedicineId(Long medicineId);
    boolean existsByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);
    
    @Query("SELECT SUM(ib.quantityAvailable - ib.quantityReserved) FROM InventoryBatch ib WHERE ib.medicineId = :medicineId")
    Integer getTotalAvailableQuantity(Long medicineId);

    List<InventoryBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    @Query("SELECT new com.medcare.inventoryservice.dto.ProductStockSummary(" +
           "ib.medicineId, ib.medicineName, ib.medicineSlug, ib.medicineImage, " +
           "ib.brand, ib.registrationNumber, ib.countryOfOrigin, " +
           "SUM(CAST(ib.quantityAvailable AS long)), SUM(CAST(ib.quantityReserved AS long)), COUNT(ib)) " +
           "FROM InventoryBatch ib " +
           "GROUP BY ib.medicineId, ib.medicineName, ib.medicineSlug, ib.medicineImage, ib.brand, ib.registrationNumber, ib.countryOfOrigin " +
           "ORDER BY ib.medicineName ASC")
    List<ProductStockSummary> findProductStockSummaries();
}
