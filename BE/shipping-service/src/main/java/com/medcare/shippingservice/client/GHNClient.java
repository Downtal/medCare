package com.medcare.shippingservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ghn-api", url = "${ghn.api.url}")
public interface GHNClient {

    @GetMapping("/master-data/province")
    Object getProvinces(@RequestHeader("Token") String token);

    @GetMapping("/master-data/district")
    Object getDistricts(@RequestHeader("Token") String token, @RequestParam("province_id") Integer provinceId);

    @GetMapping("/master-data/ward")
    Object getWards(@RequestHeader("Token") String token, @RequestParam("district_id") Integer districtId);
}
