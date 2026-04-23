package com.medcare.shippingservice.controller;

import com.medcare.shippingservice.dto.ShippingFeeRequest;
import com.medcare.shippingservice.dto.ShippingRequest;
import com.medcare.shippingservice.entity.Shipment;
import com.medcare.shippingservice.service.GHNService;
import com.medcare.shippingservice.service.ShippingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingService shippingService;
    private final GHNService ghnService;

    @PostMapping("/internal/create")
    public ResponseEntity<Shipment> createShippingOrder(@RequestBody ShippingRequest request) {
        return ResponseEntity.ok(shippingService.createShippingOrder(request));
    }

    @GetMapping("/tracking/{trackingCode}/history")
    public ResponseEntity<Object> getTrackingHistory(@PathVariable String trackingCode) {
        return ResponseEntity.ok(shippingService.getTrackingHistory(trackingCode));
    }

    @PostMapping("/fee")
    public ResponseEntity<Object> calculateFee(@RequestBody ShippingFeeRequest request) {
        return ResponseEntity.ok(ghnService.calculateFee(request));
    }

    @GetMapping("/provinces")
    public ResponseEntity<Object> getProvinces() {
        return ResponseEntity.ok(ghnService.getProvinces());
    }

    @GetMapping("/districts")
    public ResponseEntity<Object> getDistricts(@RequestParam Integer provinceId) {
        return ResponseEntity.ok(ghnService.getDistricts(provinceId));
    }

    @GetMapping("/wards")
    public ResponseEntity<Object> getWards(@RequestParam Integer districtId) {
        return ResponseEntity.ok(ghnService.getWards(districtId));
    }
}
