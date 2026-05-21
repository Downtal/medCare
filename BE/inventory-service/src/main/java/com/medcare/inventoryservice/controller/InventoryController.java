package com.medcare.inventoryservice.controller;

import com.medcare.common.dto.inventory.*;

import com.medcare.inventoryservice.dto.*;
import com.medcare.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping("/batches")
    public ResponseEntity<List<InventoryBatchResponse>> getAllBatches() {
        return ResponseEntity.ok(inventoryService.getAllBatches());
    }

    @PostMapping("/import")
    public ResponseEntity<InventoryBatchResponse> importStock(@RequestBody InventoryImportRequest request) {
        return ResponseEntity.ok(inventoryService.importStock(request));
    }

    @PostMapping("/import/bulk")
    public ResponseEntity<List<InventoryBatchResponse>> importStockBulk(@RequestBody List<InventoryImportRequest> requests) {
        return ResponseEntity.ok(inventoryService.importStockBulk(requests));
    }

    @PostMapping("/internal/deduct")
    public ResponseEntity<Void> deductStock(@RequestBody InventoryDeductRequest request) {
        inventoryService.deductStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/restore")
    public ResponseEntity<Void> restoreStock(@RequestParam String orderCode) {
        inventoryService.restoreStock(orderCode);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/product/{productId}/stock")
    public ResponseEntity<Integer> getTotalStock(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getTotalStock(productId));
    }

    @GetMapping("/products/summary")
    public ResponseEntity<?> getProductSummaries() {
        return ResponseEntity.ok(inventoryService.getProductSummaries());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<com.medcare.inventoryservice.dto.ProductStockSummary>> getLowStockProducts(
            @RequestParam(value = "threshold", defaultValue = "50") int threshold) {
        return ResponseEntity.ok(inventoryService.getLowStockProducts(threshold));
    }

    @PostMapping("/products/stocks")
    public ResponseEntity<java.util.Map<Long, Integer>> getStocks(@RequestBody List<Long> productIds) {
        java.util.Map<Long, Integer> stocks = new java.util.HashMap<>();
        for (Long id : productIds) {
            stocks.put(id, inventoryService.getTotalStock(id));
        }
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<com.medcare.inventoryservice.entity.InventoryLog>> getInventoryLogs() {
        return ResponseEntity.ok(inventoryService.getAllLogs());
    }

    // --- Warehouses ---

    @GetMapping("/warehouses")
    public ResponseEntity<?> getAllWarehouses() {
        return ResponseEntity.ok(inventoryService.getAllWarehouses());
    }

    @GetMapping("/warehouses/trash")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> getTrashedWarehouses() {
        return ResponseEntity.ok(inventoryService.getTrashedWarehouses());
    }

    @PostMapping("/warehouses")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> createWarehouse(@RequestBody com.medcare.inventoryservice.entity.Warehouse warehouse) {
        return ResponseEntity.ok(inventoryService.createWarehouse(warehouse));
    }

    @PutMapping("/warehouses/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> updateWarehouse(@PathVariable Long id, @RequestBody com.medcare.inventoryservice.entity.Warehouse warehouse) {
        return ResponseEntity.ok(inventoryService.updateWarehouse(id, warehouse));
    }

    @DeleteMapping("/warehouses/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> deleteWarehouse(@PathVariable Long id) {
        inventoryService.deleteWarehouse(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Warehouse moved to trash"));
    }

    @PostMapping("/warehouses/{id}/restore")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> restoreWarehouse(@PathVariable Long id) {
        inventoryService.restoreWarehouse(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Warehouse restored"));
    }

    @DeleteMapping("/warehouses/{id}/hard")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteWarehouseHard(@PathVariable Long id) {
        inventoryService.deleteWarehouseHard(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Warehouse deleted permanently"));
    }

    @DeleteMapping("/product/{productId}/hard")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProductStock(@PathVariable Long productId) {
        inventoryService.deleteProductStock(productId);
        return ResponseEntity.noContent().build();
    }
}
