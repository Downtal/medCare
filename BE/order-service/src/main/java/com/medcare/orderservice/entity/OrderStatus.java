package com.medcare.orderservice.entity;

public enum OrderStatus {
    PENDING_PRESCRIPTION, // Waiting for pharmacist to approve prescription
    PENDING,              // Waiting for confirmation (OTC or after prescription approved)
    CONFIRMED,            // Confirmed by staff/system
    CONFIRME,             // Fallback for DB typo
    SHIPPING,             // Handed over to courier
    DELIVERED,            // Successfully delivered
    CANCELLED,            // Cancelled or Rejected
    PAID                  // Paid via Online Payment
}
