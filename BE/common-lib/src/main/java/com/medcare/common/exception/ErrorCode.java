package com.medcare.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ---- Generic ----
    SUCCESS(200, "Success", HttpStatus.OK),
    INTERNAL_SERVER_ERROR(500, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR(400, "Validation error", HttpStatus.BAD_REQUEST),
    NOT_FOUND(404, "Resource not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(401, "Unauthorized", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(403, "Access denied", HttpStatus.FORBIDDEN),
    CONFLICT(409, "Resource already exists", HttpStatus.CONFLICT),

    // ---- Auth ----
    INVALID_TOKEN(1001, "Invalid or expired token", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(1002, "Invalid email or password", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED(1003, "Account is disabled", HttpStatus.FORBIDDEN),
    EMAIL_ALREADY_EXISTS(1004, "Email already in use", HttpStatus.CONFLICT),

    // ---- User ----
    USER_NOT_FOUND(2001, "User not found", HttpStatus.NOT_FOUND),

    // ---- Product ----
    PRODUCT_NOT_FOUND(3001, "Product not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_STOCK(3002, "Insufficient stock", HttpStatus.CONFLICT),
    INVENTORY_CONFLICT(3003, "Inventory is being updated. Please try again.", HttpStatus.CONFLICT),

    // ---- Order ----
    ORDER_NOT_FOUND(4001, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_CANNOT_BE_CANCELLED(4002, "Order cannot be cancelled at this stage", HttpStatus.CONFLICT),

    // ---- Payment ----
    PAYMENT_FAILED(5001, "Payment processing failed", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_SIGNATURE(5002, "Invalid payment signature", HttpStatus.BAD_REQUEST),

    // ---- Promotion ----
    VOUCHER_NOT_FOUND(6001, "Voucher not found", HttpStatus.NOT_FOUND),
    VOUCHER_EXPIRED(6002, "Voucher has expired", HttpStatus.CONFLICT),
    VOUCHER_USED(6003, "Voucher has already been used", HttpStatus.CONFLICT);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
