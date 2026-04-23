package com.medcare.shippingservice.service;

import com.medcare.shippingservice.dto.ShippingFeeRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class GHNService {

    @Value("${ghn.api.url}")
    private String apiUrl;

    @Value("${ghn.api.token}")
    private String apiToken;

    @Value("${ghn.api.shopId}")
    private String shopId;

    private final RestTemplate restTemplate;

    public GHNService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Object calculateFee(ShippingFeeRequest request) {
        String url = apiUrl + "/shipping-order/fee";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", apiToken);
        headers.set("ShopId", shopId);

        Map<String, Object> body = new HashMap<>();
        body.put("to_district_id", request.getToDistrictId());
        body.put("to_ward_code", request.getToWardCode());
        body.put("weight", request.getWeight() != null ? request.getWeight() : 1000); // default 1kg
        body.put("length", request.getLength() != null ? request.getLength() : 10);
        body.put("width", request.getWidth() != null ? request.getWidth() : 10);
        body.put("height", request.getHeight() != null ? request.getHeight() : 10);
        body.put("insurance_value", request.getInsuranceValue() != null ? request.getInsuranceValue() : 0);
        body.put("service_type_id", request.getServiceTypeId() != null ? request.getServiceTypeId() : 2);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url, entity, Object.class);
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Error calculating shipping fee with GHN: " + e.getMessage());
        }
    }

    public Object getProvinces() {
        String url = apiUrl.replace("/v2", "") + "/master-data/province";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", apiToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, Object.class).getBody();
    }

    public Object getDistricts(Integer provinceId) {
        String url = apiUrl.replace("/v2", "") + "/master-data/district";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = new HashMap<>();
        body.put("province_id", provinceId);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForEntity(url, entity, Object.class).getBody();
    }

    public Object getWards(Integer districtId) {
        String url = apiUrl.replace("/v2", "") + "/master-data/ward";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = new HashMap<>();
        body.put("district_id", districtId);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForEntity(url, entity, Object.class).getBody();
    }
}
