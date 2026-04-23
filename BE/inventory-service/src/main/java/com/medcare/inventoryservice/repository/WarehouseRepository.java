package com.medcare.inventoryservice.repository;

import com.medcare.inventoryservice.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findAllByDeletedAtIsNull();
    List<Warehouse> findAllByDeletedAtIsNotNull();
}
