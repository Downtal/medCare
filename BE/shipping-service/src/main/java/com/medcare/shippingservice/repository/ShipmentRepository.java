package com.medcare.shippingservice.repository;

import com.medcare.shippingservice.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByOrderCode(String orderCode);
    Optional<Shipment> findByTrackingCode(String trackingCode);
}
