package com.medcare.inventoryservice.service;

import com.medcare.common.dto.inventory.InventoryDeductRequest;
import com.medcare.inventoryservice.entity.InventoryBatch;
import com.medcare.inventoryservice.entity.Warehouse;
import com.medcare.inventoryservice.repository.InventoryBatchRepository;
import com.medcare.inventoryservice.repository.WarehouseRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
class InventoryConcurrencyIntegrationTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        public MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryBatchRepository inventoryBatchRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    private Long medicineId = 999L;
    private Warehouse warehouse;

    @BeforeEach
    void setUp() {
        inventoryBatchRepository.deleteAll();
        warehouseRepository.deleteAll();

        warehouse = Warehouse.builder()
                .name("Test Warehouse")
                .address("123 Test St")
                .status(true)
                .build();
        warehouse = warehouseRepository.save(warehouse);
    }

    @Test
    void shouldDeductStockCorrectlyUnderHighConcurrency() throws InterruptedException {
        // Given: 1 batch with 100 items
        InventoryBatch batch = InventoryBatch.builder()
                .medicineId(medicineId)
                .medicineName("Concurrency Test Pill")
                .warehouse(warehouse)
                .batchNumber("B-100")
                .expiryDate(java.time.LocalDate.now().plusYears(1))
                .quantityAvailable(100)
                .quantityReserved(0)
                .status(InventoryBatch.BatchStatus.ACTIVE)
                .build();
        inventoryBatchRepository.save(batch);

        int numberOfThreads = 50;
        int quantityPerRequest = 2; // Total 50 * 2 = 100 items
        
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        // When: 50 threads try to deduct 2 items each
        for (int i = 0; i < numberOfThreads; i++) {
            final int index = i;
            executorService.submit(() -> {
                try {
                    InventoryDeductRequest request = InventoryDeductRequest.builder()
                            .orderCode("ORD-CONC-" + index)
                            .items(List.of(InventoryDeductRequest.DeductItem.builder()
                                    .productId(medicineId)
                                    .quantity(quantityPerRequest)
                                    .build()))
                            .build();
                    inventoryService.deductStock(request);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    System.err.println("Thread failed: " + e.getMessage());
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executorService.shutdown();

        // Then
        Integer finalStock = inventoryBatchRepository.getTotalAvailableQuantity(medicineId);
        assertEquals(0, finalStock, "Final stock should be exactly 0");
        assertEquals(50, successCount.get(), "All 50 requests should succeed");
        assertEquals(0, failureCount.get(), "There should be no failures");
    }
    
    @Test
    void shouldPreventOversellingUnderCompetition() throws InterruptedException {
        // Given: 1 batch with only 10 items
        InventoryBatch batch = InventoryBatch.builder()
                .medicineId(medicineId + 1)
                .medicineName("Oversell Test Pill")
                .warehouse(warehouse)
                .batchNumber("B-OVERSELL")
                .expiryDate(java.time.LocalDate.now().plusYears(1))
                .quantityAvailable(10)
                .quantityReserved(0)
                .status(InventoryBatch.BatchStatus.ACTIVE)
                .build();
        inventoryBatchRepository.save(batch);

        int numberOfThreads = 20;
        int quantityPerRequest = 1; // Total 20 requests for 10 items
        
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            final int index = i;
            executorService.submit(() -> {
                try {
                    InventoryDeductRequest request = InventoryDeductRequest.builder()
                            .orderCode("ORD-OVER-" + index)
                            .items(List.of(InventoryDeductRequest.DeductItem.builder()
                                    .productId(medicineId + 1)
                                    .quantity(quantityPerRequest)
                                    .build()))
                            .build();
                    inventoryService.deductStock(request);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executorService.shutdown();

        // Then
        Integer finalStock = inventoryBatchRepository.getTotalAvailableQuantity(medicineId + 1);
        assertEquals(0, finalStock, "Final stock should be 0");
        assertEquals(10, successCount.get(), "Exactly 10 requests should succeed");
        assertEquals(10, failureCount.get(), "Exactly 10 requests should fail (insufficient stock)");
    }
}
