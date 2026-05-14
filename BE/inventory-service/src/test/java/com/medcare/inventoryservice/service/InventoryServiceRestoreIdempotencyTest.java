package com.medcare.inventoryservice.service;

import com.medcare.inventoryservice.entity.InventoryBatch;
import com.medcare.inventoryservice.entity.InventoryChangeType;
import com.medcare.inventoryservice.entity.InventoryLog;
import com.medcare.inventoryservice.repository.InventoryBatchRepository;
import com.medcare.inventoryservice.repository.InventoryLogRepository;
import com.medcare.inventoryservice.repository.WarehouseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceRestoreIdempotencyTest {

    @Mock private InventoryBatchRepository inventoryBatchRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private InventoryLogRepository inventoryLogRepository;
    @Mock private TransactionTemplate transactionTemplate;

    @InjectMocks private InventoryService inventoryService;

    @Test
    void shouldApplyRestoreOnlyOnceForRepeatedCalls() {
        String orderCode = "ORD-500";
        InventoryLog outLog = new InventoryLog();
        outLog.setId(55L);
        outLog.setMedicineId(100L);
        outLog.setBatchId(500L);
        outLog.setQuantity(4);
        outLog.setReferenceId(orderCode);
        outLog.setChangeType(InventoryChangeType.OUT);

        InventoryBatch batch = new InventoryBatch();
        batch.setId(500L);
        batch.setMedicineId(100L);
        batch.setQuantityAvailable(10);
        batch.setQuantityReserved(0);

        when(inventoryLogRepository.findByReferenceIdAndChangeType(orderCode, InventoryChangeType.OUT))
                .thenReturn(List.of(outLog));
        when(inventoryLogRepository.existsByIdempotencyKey("restore:ORD-500:55"))
                .thenReturn(false, true);
        when(inventoryBatchRepository.findByIdForUpdate(500L))
                .thenReturn(Optional.of(batch));

        inventoryService.restoreStock(orderCode);
        inventoryService.restoreStock(orderCode);

        verify(inventoryBatchRepository, times(1)).save(batch);
        verify(inventoryLogRepository, times(1)).save(org.mockito.ArgumentMatchers.any(InventoryLog.class));
        assertEquals(14, batch.getQuantityAvailable());

        ArgumentCaptor<InventoryLog> logCaptor = ArgumentCaptor.forClass(InventoryLog.class);
        verify(inventoryLogRepository).save(logCaptor.capture());
        InventoryLog savedLog = logCaptor.getValue();
        assertNotNull(savedLog);
        assertEquals("restore:ORD-500:55", savedLog.getIdempotencyKey());
        assertEquals(InventoryChangeType.IN, savedLog.getChangeType());
        assertEquals(orderCode, savedLog.getReferenceId());
    }

    @Test
    void shouldSkipRestoreWhenNoOutLogExists() {
        String orderCode = "ORD-501";
        when(inventoryLogRepository.findByReferenceIdAndChangeType(orderCode, InventoryChangeType.OUT))
                .thenReturn(List.of());

        inventoryService.restoreStock(orderCode);

        verify(inventoryBatchRepository, never()).save(org.mockito.ArgumentMatchers.any(InventoryBatch.class));
        verify(inventoryLogRepository, never()).save(org.mockito.ArgumentMatchers.any(InventoryLog.class));
    }
}
