package com.medcare.inventoryservice.config;

import com.medcare.inventoryservice.entity.Warehouse;
import com.medcare.inventoryservice.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class InventoryInitConfig implements CommandLineRunner {
    private final WarehouseRepository warehouseRepository;

    @Override
    public void run(String... args) {
        if (warehouseRepository.count() == 0) {
            Warehouse warehouse = Warehouse.builder()
                    .name("Kho Quận 1 (Chính)")
                    .address("123 Lê Lợi, Quận 1, TP.HCM")
                    .build();
            warehouseRepository.save(warehouse);

            Warehouse warehouse2 = Warehouse.builder()
                    .name("Kho Thủ Đức")
                    .address("456 Võ Văn Ngân, Thủ Đức, TP.HCM")
                    .build();
            warehouseRepository.save(warehouse2);
        }
    }
}
