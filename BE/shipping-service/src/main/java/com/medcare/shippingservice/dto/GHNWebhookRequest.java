package com.medcare.shippingservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GHNWebhookRequest {
    @JsonProperty("OrderCode")
    private String orderCode; // GHN tracking code
    
    @JsonProperty("Status")
    private String status;
    
    @JsonProperty("ClientOrderCode")
    private String clientOrderCode; // Our order code
    
    @JsonProperty("Description")
    private String description;
    
    @JsonProperty("Warehouse")
    private String warehouse;
}
