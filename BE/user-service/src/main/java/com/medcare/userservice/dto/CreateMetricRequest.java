package com.medcare.userservice.dto;

import lombok.Data;

@Data
public class CreateMetricRequest {
    private String type;
    private Double value;
    private String unit;
}
