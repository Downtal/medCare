package com.medcare.shippingservice.controller;

import com.medcare.shippingservice.service.MasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shipping/master-data")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService masterDataService;

    @GetMapping("/provinces")
    public ResponseEntity<Object> getProvinces() {
        return ResponseEntity.ok(masterDataService.getProvinces());
    }

    @GetMapping("/districts")
    public ResponseEntity<Object> getDistricts(@RequestParam Integer provinceId) {
        return ResponseEntity.ok(masterDataService.getDistricts(provinceId));
    }

    @GetMapping("/wards")
    public ResponseEntity<Object> getWards(@RequestParam Integer districtId) {
        return ResponseEntity.ok(masterDataService.getWards(districtId));
    }
}
