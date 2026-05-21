package com.medcare.inventoryservice.service;

import com.medcare.common.dto.inventory.*;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.inventoryservice.dto.*;
import com.medcare.inventoryservice.entity.*;
import com.medcare.inventoryservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.CannotSerializeTransactionException;
import org.springframework.dao.DeadlockLoserDataAccessException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {
    private static final int MAX_LOCK_RETRY_ATTEMPTS = 3;
    private static final long[] LOCK_RETRY_BACKOFF_MS = {100L, 250L, 500L};

    private final InventoryBatchRepository inventoryBatchRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final TransactionTemplate transactionTemplate;

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
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found"));
        warehouse.setName(details.getName());
        warehouse.setAddress(details.getAddress());
        if (details.getStatus() != null) warehouse.setStatus(details.getStatus());
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found"));
        warehouse.setDeletedAt(java.time.LocalDateTime.now());
        warehouseRepository.save(warehouse);
    }

    @Transactional
    public void restoreWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found"));
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
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found"));

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

    public void deductStock(InventoryDeductRequest request) {
        log.info("Deducting stock for {} items", request.getItems().size());
        for (int attempt = 1; attempt <= MAX_LOCK_RETRY_ATTEMPTS; attempt++) {
            try {
                transactionTemplate.executeWithoutResult(status -> deductStockInSingleTransaction(request));
                return;
            } catch (RuntimeException exception) {
                if (!isLockContentionException(exception)) {
                    throw exception;
                }

                if (attempt >= MAX_LOCK_RETRY_ATTEMPTS) {
                    log.warn("Lock contention retry exhausted for order {}", request.getOrderCode(), exception);
                    throw new AppException(ErrorCode.INVENTORY_CONFLICT);
                }

                long backoffMs = LOCK_RETRY_BACKOFF_MS[Math.min(attempt - 1, LOCK_RETRY_BACKOFF_MS.length - 1)];
                log.warn("Lock contention detected for order {}. Retry {}/{} after {} ms",
                        request.getOrderCode(), attempt, MAX_LOCK_RETRY_ATTEMPTS, backoffMs);
                sleepRetryBackoff(backoffMs);
            }
        }
    }

    @Transactional
    public void restoreStock(String orderCode) {
        log.info("Restoring stock for order: {}", orderCode);

        // Find all OUT logs for this order
        List<InventoryLog> outLogs = inventoryLogRepository.findByReferenceIdAndChangeType(orderCode, InventoryChangeType.OUT);

        if (outLogs.isEmpty()) {
            log.warn("No stock deduction found for order: {}", orderCode);
            return;
        }

        for (InventoryLog logEntry : outLogs) {
            String idempotencyKey = buildRestoreIdempotencyKey(orderCode, logEntry);
            if (inventoryLogRepository.existsByIdempotencyKey(idempotencyKey)) {
                log.info("Skip duplicated restore for idempotencyKey={}", idempotencyKey);
                continue;
            }

            InventoryBatch batch = inventoryBatchRepository.findByIdForUpdate(logEntry.getBatchId())
                    .orElse(null);
            if (batch == null) {
                continue;
            }

            batch.setQuantityAvailable(batch.getQuantityAvailable() + logEntry.getQuantity());
            inventoryBatchRepository.save(batch);

            // Log restoration
            inventoryLogRepository.save(InventoryLog.builder()
                    .medicineId(logEntry.getMedicineId())
                    .batchId(batch.getId())
                    .changeType(InventoryChangeType.IN)
                    .quantity(logEntry.getQuantity())
                    .referenceId(orderCode)
                    .idempotencyKey(idempotencyKey)
                    .notes("Hoàn kho cho đơn hàng bị hủy: " + orderCode)
                    .build());

            log.info("Restored {} items to batch {} for product {}", logEntry.getQuantity(), batch.getBatchNumber(), logEntry.getMedicineId());
        }
    }

    public Integer getTotalStock(Long medicineId) {
        Integer stock = inventoryBatchRepository.getTotalAvailableQuantity(medicineId);
        return stock != null ? stock : 0;
    }

    public List<InventoryLog> getAllLogs() {
        return inventoryLogRepository.findAllByOrderByCreatedAtDesc();
    }

    private void deductStockInSingleTransaction(InventoryDeductRequest request) {
        for (InventoryDeductRequest.DeductItem item : request.getItems()) {
            int remainingToDeduct = item.getQuantity();

            List<InventoryBatch> activeBatches = inventoryBatchRepository.findActiveBatchesForDeductWithLock(item.getProductId());
            int totalAvailable = activeBatches.stream()
                    .mapToInt(batch -> batch.getQuantityAvailable() - batch.getQuantityReserved())
                    .sum();

            if (totalAvailable < remainingToDeduct) {
                log.error("Insufficient stock for product ID {}: requested {}, available {}", item.getProductId(), remainingToDeduct, totalAvailable);
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Không đủ hàng tồn kho cho sản phẩm ID: " + item.getProductId());
            }

            for (InventoryBatch batch : activeBatches) {
                if (remainingToDeduct <= 0) {
                    break;
                }

                int availableInBatch = batch.getQuantityAvailable() - batch.getQuantityReserved();
                if (availableInBatch <= 0) {
                    continue;
                }

                int amountFromThisBatch = Math.min(availableInBatch, remainingToDeduct);
                batch.setQuantityAvailable(batch.getQuantityAvailable() - amountFromThisBatch);
                inventoryBatchRepository.save(batch);

                inventoryLogRepository.save(InventoryLog.builder()
                        .medicineId(item.getProductId())
                        .batchId(batch.getId())
                        .changeType(InventoryChangeType.OUT)
                        .quantity(amountFromThisBatch)
                        .referenceId(request.getOrderCode())
                        .notes("Trừ kho cho đơn hàng: " + request.getOrderCode())
                        .build());

                remainingToDeduct -= amountFromThisBatch;
            }
        }
    }

    private boolean isLockContentionException(Throwable exception) {
        if (exception == null) {
            return false;
        }

        if (exception instanceof AppException) {
            return false;
        }

        if (exception instanceof DeadlockLoserDataAccessException
                || exception instanceof CannotAcquireLockException
                || exception instanceof PessimisticLockingFailureException
                || exception instanceof CannotSerializeTransactionException) {
            return true;
        }

        if (exception instanceof JpaSystemException) {
            String message = exception.getMessage();
            if (message != null) {
                String normalizedMessage = message.toLowerCase();
                return normalizedMessage.contains("deadlock")
                        || normalizedMessage.contains("lock wait timeout")
                        || normalizedMessage.contains("could not obtain lock");
            }
        }

        return isLockContentionException(exception.getCause());
    }

    private void sleepRetryBackoff(long backoffMs) {
        try {
            TimeUnit.MILLISECONDS.sleep(backoffMs);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, interruptedException);
        }
    }

    private String buildRestoreIdempotencyKey(String orderCode, InventoryLog outLog) {
        return "restore:" + orderCode + ":" + outLog.getId();
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

    public List<ProductStockSummary> getLowStockProducts(int threshold) {
        return inventoryBatchRepository.findLowStockSummaries((long) threshold);
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

    @Transactional
    public void deleteProductStock(Long medicineId) {
        log.info("Deleting all inventory data for product ID: {}", medicineId);
        inventoryLogRepository.deleteByMedicineId(medicineId);
        inventoryBatchRepository.deleteByMedicineId(medicineId);
    }
}
