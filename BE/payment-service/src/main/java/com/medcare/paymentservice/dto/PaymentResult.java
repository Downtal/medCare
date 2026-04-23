package com.medcare.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResult {
    private String orderId;
    private String amount;
    private String responseCode;
    private String transactionNo;
    private String message;
    private boolean success;
}
