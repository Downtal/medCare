package com.medcare.inventoryservice.service;

import com.medcare.inventoryservice.dto.*;
import com.medcare.inventoryservice.entity.*;
import com.medcare.inventoryservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryBatchRepository inventoryBatchRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryLogRepository inventoryLogRepository;


    public List<InventoryBatchResponse> getAllBatches() {
        return inventoryBatchRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- Warehouse Management ---

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAllByDeletedAtIsNull();
    }

    public List<Warehouse> getTrashedWarehouses() {
        return warehouseRepository.findAllByDeletedAtIsNotNull();
    }

    @Transactional
    public Warehouse createWarehouse(Warehouse warehouse) {
        warehouse.setStatus(true);
        warehouse.setDeletedAt(null);
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public Warehouse updateWarehouse(Long id, Warehouse details) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        warehouse.setName(details.getName());
        warehouse.setAddress(details.getAddress());
        if (details.getStatus() != null) warehouse.setStatus(details.getStatus());
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        warehouse.setDeletedAt(java.time.LocalDateTime.now());
        warehouseRepository.save(warehouse);
    }

    @Transactional
    public void restoreWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        warehouse.setDeletedAt(null);
        warehouseRepository.save(warehouse);
    }

    @Transactional
    public void deleteWarehouseHard(Long id) {
        warehouseRepository.deleteById(id);
    }

    // --- Stock Management ---

    @Transactional
    public InventoryBatchResponse importStock(InventoryImportRequest request) {
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        InventoryBatch batch = InventoryBatch.builder()
                .medicineId(request.getMedicineId())
                .medicineName(request.getMedicineName())
                .medicineSlug(request.getMedicineSlug())
                .medicineImage(request.getMedicineImage())
                .brand(request.getBrand())
                .registrationNumber(request.getRegistrationNumber())
                .countryOfOrigin(request.getCountryOfOrigin())
                .warehouse(warehouse)
                .batchNumber(request.getBatchNumber())
                .expiryDate(request.getExpiryDate())
                .quantityAvailable(request.getQuantity())
                .quantityReserved(0)
                .status(InventoryBatch.BatchStatus.ACTIVE)
                .build();

        InventoryBatch savedBatch = inventoryBatchRepository.save(batch);

        // Create log
        inventoryLogRepository.save(InventoryLog.builder()
                .medicineId(savedBatch.getMedicineId())
                .batchId(savedBatch.getId())
                .changeType(InventoryChangeType.IN)
                .quantity(savedBatch.getQuantityAvailable())
                .notes("Nhập kho lô mới: " + savedBatch.getBatchNumber())
                .build());

        return mapToResponse(savedBatch);
    }

    @Transactional
    public List<InventoryBatchResponse> importStockBulk(List<InventoryImportRequest> requests) {
        return requests.stream()
                .map(this::importStock)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deductStock(StockDeductRequest request) {
        log.info("Deducting stock for {} items", request.getItems().size());
        
        for (StockDeductRequest.DeductItem item : request.getItems()) {
            int remainingToDeduct = item.getQuantity();
            
            // Find active batches ordered by expiry date (FIFO)
            List<InventoryBatch> activeBatches = inventoryBatchRepository.findByMedicineIdOrderByExpiryDateAsc(item.getProductId());
            
            int totalAvailable = activeBatches.stream()
                    .mapToInt(b -> b.getQuantityAvailable() - b.getQuantityReserved())
                    .sum();
            
            if (totalAvailable < remainingToDeduct) {
                log.error("Insufficient stock for product ID {}: requested {}, available {}", item.getProductId(), remainingToDeduct, totalAvailable);
                throw new RuntimeException("Không đủ hàng tồn kho cho sản phẩm ID: " + item.getProductId());
            }

            for (InventoryBatch batch : activeBatches) {
                if (remainingToDeduct <= 0) break;
                
                int availableInBatch = batch.getQuantityAvailable() - batch.getQuantityReserved();
                if (availableInBatch <= 0) continue;

                int amountFromThisBatch = Math.min(availableInBatch, remainingToDeduct);
                batch.setQuantityAvailable(batch.getQuantityAvailable() - amountFromThisBatch);
                inventoryBatchRepository.save(batch);

                // Log deduction
                inventoryLogRepository.save(InventoryLog.builder()
                        .medicineId(item.getProductId())
                        .batchId(batch.getId())
                        .changeType(InventoryChangeType.OUT)
                        .quantity(amountFromThisBatch)
                        .notes("Trừ kho cho đơn hàng mới")
                        .build());

                remainingToDeduct -= amountFromThisBatch;
            }
        }
    }

    public Integer getTotalStock(Long medicineId) {
        Integer stock = inventoryBatchRepository.getTotalAvailableQuantity(medicineId);
        return stock != null ? stock : 0;
    }

    public List<InventoryLog> getAllLogs() {
        return inventoryLogRepository.findAllByOrderByCreatedAtDesc();
    }

    private InventoryBatchResponse mapToResponse(InventoryBatch batch) {
        return InventoryBatchResponse.builder()
                .id(batch.getId())
                .medicineId(batch.getMedicineId())
                .medicineName(batch.getMedicineName())
                .medicineSlug(batch.getMedicineSlug())
                .medicineImage(batch.getMedicineImage())
                .brand(batch.getBrand())
                .registrationNumber(batch.getRegistrationNumber())
                .countryOfOrigin(batch.getCountryOfOrigin())
                .warehouseId(batch.getWarehouse().getId())
                .warehouseName(batch.getWarehouse().getName())
                .batchNumber(batch.getBatchNumber())
                .expiryDate(batch.getExpiryDate())
                .quantityAvailable(batch.getQuantityAvailable())
                .quantityReserved(batch.getQuantityReserved())
                .build();
    }

    public List<ProductStockSummary> getProductSummaries() {
        return inventoryBatchRepository.findProductStockSummaries();
    }

    @Transactional
    public void handleProductCreated(ProductCreatedEvent event) {
        Long medicineId = event.getMedicineId();
        String name = event.getName();

        // Idempotency check
        String targetBatch = event.getInitialBatchNumber() != null && !event.getInitialBatchNumber().isEmpty() 
            ? event.getInitialBatchNumber() : "AUTO-INIT";

        if (inventoryBatchRepository.existsByMedicineIdAndBatchNumber(medicineId, targetBatch)) {
            return;
        }

        // Get default warehouse or create if empty
        Warehouse warehouse = warehouseRepository.findAll().stream().findFirst()
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .name("Kho mặc định")
                        .address("Hệ thống tự động")
                        .status(true)
                        .build()));

        Integer quantity = event.getInitialQuantity() != null ? event.getInitialQuantity() : 0;
        
        java.time.LocalDate expiryDate;
        try {
            expiryDate = (event.getInitialExpiryDate() != null && !event.getInitialExpiryDate().isEmpty())
                ? java.time.LocalDate.parse(event.getInitialExpiryDate().substring(0, 10)) 
                : java.time.LocalDate.now().plusYears(2);
        } catch (Exception e) {
            expiryDate = java.time.LocalDate.now().plusYears(2);
        }

        InventoryBatch batch = InventoryBatch.builder()
                .medicineId(medicineId)
                .medicineName(name)
                .medicineSlug(event.getMedicineSlug())
                .medicineImage(event.getMedicineImage())
                .brand(event.getBrand())
                .registrationNumber(event.getRegistrationNumber())
                .countryOfOrigin(event.getCountryOfOrigin())
                .warehouse(warehouse)
                .batchNumber(targetBatch)
                .expiryDate(expiryDate)
                .quantityAvailable(quantity)
                .quantityReserved(0)
                .status(quantity > 0 ? InventoryBatch.BatchStatus.ACTIVE : InventoryBatch.BatchStatus.QUARANTINE)
                .build();
 
        InventoryBatch savedBatch = inventoryBatchRepository.save(batch);
        
        inventoryLogRepository.save(InventoryLog.builder()
                .medicineId(medicineId)
                .batchId(savedBatch.getId())
                .changeType(InventoryChangeType.IN)
                .quantity(quantity)
                .notes("Tự động khởi tạo tồn kho khi tạo sản phẩm")
                .build());
    }
}
