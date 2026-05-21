package com.medcare.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationSignalsResponse {
    private Long userId;

    @Builder.Default
    private List<RecommendationOrderSignalDto> orderSignals = new ArrayList<>();

    @Builder.Default
    private List<RecommendationCartSignalDto> cartSignals = new ArrayList<>();
}
