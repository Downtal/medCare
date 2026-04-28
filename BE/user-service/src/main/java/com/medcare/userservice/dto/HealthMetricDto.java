package com.medcare.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthMetricDto {
    private Long id;
    private String type;
    private Double value;
    private String unit;
    private LocalDateTime recordedAt;
}
