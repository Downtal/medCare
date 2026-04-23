package com.medcare.shippingservice.service;

import com.medcare.shippingservice.client.GHNClient;
import com.medcare.shippingservice.config.GHNConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MasterDataService {

    private final GHNClient ghnClient;
    private final GHNConfig ghnConfig;

    @Cacheable(value = "ghn-provinces")
    public Object getProvinces() {
        return ghnClient.getProvinces(ghnConfig.getToken());
    }

    @Cacheable(value = "ghn-districts", key = "#provinceId")
    public Object getDistricts(Integer provinceId) {
        return ghnClient.getDistricts(ghnConfig.getToken(), provinceId);
    }

    @Cacheable(value = "ghn-wards", key = "#districtId")
    public Object getWards(Integer districtId) {
        return ghnClient.getWards(ghnConfig.getToken(), districtId);
    }
}
