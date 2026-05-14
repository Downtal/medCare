package com.medcare.inventoryservice.service;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.inventoryservice.dto.StockDeductRequest;
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
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceConcurrencyTest {

    @Mock private InventoryBatchRepository inventoryBatchRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private InventoryLogRepository inventoryLogRepository;
    @Mock private TransactionTemplate transactionTemplate;

    @InjectMocks private InventoryService inventoryService;

    @Test
    void shouldDeductUsingLockedFifoBatches() {
        StockDeductRequest request = StockDeductRequest.builder()
                .orderCode("ORD-100")
                .items(List.of(StockDeductRequest.DeductItem.builder()
                        .productId(10L)
                        .quantity(7)
                        .build()))
                .build();

        InventoryBatch firstBatch = buildBatch(1L, 10L, 5, 0);
        InventoryBatch secondBatch = buildBatch(2L, 10L, 10, 0);

        doAnswer(invocation -> {
            Consumer<TransactionStatus> callback = invocation.getArgument(0);
            callback.accept(mock(TransactionStatus.class));
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());

        when(inventoryBatchRepository.findActiveBatchesForDeductWithLock(10L))
                .thenReturn(List.of(firstBatch, secondBatch));

        inventoryService.deductStock(request);

        verify(inventoryBatchRepository).findActiveBatchesForDeductWithLock(10L);
        verify(inventoryBatchRepository, times(2)).save(any(InventoryBatch.class));

        assertEquals(0, firstBatch.getQuantityAvailable());
        assertEquals(8, secondBatch.getQuantityAvailable());

        ArgumentCaptor<InventoryLog> logCaptor = ArgumentCaptor.forClass(InventoryLog.class);
        verify(inventoryLogRepository, times(2)).save(logCaptor.capture());

        List<InventoryLog> savedLogs = logCaptor.getAllValues();
        assertEquals(InventoryChangeType.OUT, savedLogs.get(0).getChangeType());
        assertEquals(5, savedLogs.get(0).getQuantity());
        assertEquals(InventoryChangeType.OUT, savedLogs.get(1).getChangeType());
        assertEquals(2, savedLogs.get(1).getQuantity());
    }

    @Test
    void shouldRetryOnLockContentionAndThenSucceed() {
        StockDeductRequest request = StockDeductRequest.builder()
                .orderCode("ORD-200")
                .items(List.of(StockDeductRequest.DeductItem.builder()
                        .productId(11L)
                        .quantity(1)
                        .build()))
                .build();

        InventoryBatch batch = buildBatch(3L, 11L, 5, 0);

        doThrow(new CannotAcquireLockException("lock timeout"))
                .doAnswer(invocation -> {
                    Consumer<TransactionStatus> callback = invocation.getArgument(0);
                    callback.accept(mock(TransactionStatus.class));
                    return null;
                })
                .when(transactionTemplate).executeWithoutResult(any());

        when(inventoryBatchRepository.findActiveBatchesForDeductWithLock(11L))
                .thenReturn(List.of(batch));

        inventoryService.deductStock(request);

        verify(transactionTemplate, times(2)).executeWithoutResult(any());
        assertEquals(4, batch.getQuantityAvailable());
    }

    @Test
    void shouldMapExhaustedLockContentionToInventoryConflict() {
        StockDeductRequest request = StockDeductRequest.builder()
                .orderCode("ORD-300")
                .items(List.of(StockDeductRequest.DeductItem.builder()
                        .productId(12L)
                        .quantity(1)
                        .build()))
                .build();

        doThrow(new CannotAcquireLockException("lock timeout"))
                .when(transactionTemplate).executeWithoutResult(any());

        AppException exception = assertThrows(AppException.class, () -> inventoryService.deductStock(request));
        assertEquals(ErrorCode.INVENTORY_CONFLICT, exception.getErrorCode());
        verify(transactionTemplate, times(3)).executeWithoutResult(any());
    }

    @Test
    void shouldNotRetryWhenStockIsInsufficient() {
        StockDeductRequest request = StockDeductRequest.builder()
                .orderCode("ORD-400")
                .items(List.of(StockDeductRequest.DeductItem.builder()
                        .productId(13L)
                        .quantity(10)
                        .build()))
                .build();

        InventoryBatch batch = buildBatch(4L, 13L, 3, 0);

        doAnswer(invocation -> {
            Consumer<TransactionStatus> callback = invocation.getArgument(0);
            callback.accept(mock(TransactionStatus.class));
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());

        when(inventoryBatchRepository.findActiveBatchesForDeductWithLock(13L))
                .thenReturn(List.of(batch));

        AppException exception = assertThrows(AppException.class, () -> inventoryService.deductStock(request));
        assertEquals(ErrorCode.INSUFFICIENT_STOCK, exception.getErrorCode());
        verify(transactionTemplate, times(1)).executeWithoutResult(any());
    }

    private InventoryBatch buildBatch(Long id, Long medicineId, int quantityAvailable, int quantityReserved) {
        InventoryBatch batch = new InventoryBatch();
        batch.setId(id);
        batch.setMedicineId(medicineId);
        batch.setQuantityAvailable(quantityAvailable);
        batch.setQuantityReserved(quantityReserved);
        batch.setStatus(InventoryBatch.BatchStatus.ACTIVE);
        return batch;
    }
}
