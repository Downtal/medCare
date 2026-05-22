package com.medcare.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ---- Generic ----
    SUCCESS(200, "Thành công", HttpStatus.OK),
    INTERNAL_SERVER_ERROR(500, "Lỗi máy chủ nội bộ", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR(400, "Lỗi xác thực dữ liệu", HttpStatus.BAD_REQUEST),
    NOT_FOUND(404, "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(401, "Chưa xác thực quyền truy cập", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(403, "Từ chối truy cập", HttpStatus.FORBIDDEN),
    CONFLICT(409, "Tài nguyên đã tồn tại", HttpStatus.CONFLICT),

    // ---- Auth ----
    INVALID_TOKEN(1001, "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(1002, "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED(1003, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    EMAIL_ALREADY_EXISTS(1004, "Email đã được sử dụng", HttpStatus.CONFLICT),

    // ---- User ----
    USER_NOT_FOUND(2001, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),

    // ---- Product ----
    PRODUCT_NOT_FOUND(3001, "Không tìm thấy sản phẩm", HttpStatus.NOT_FOUND),
    INSUFFICIENT_STOCK(3002, "Không đủ số lượng tồn kho", HttpStatus.CONFLICT),
    INVENTORY_CONFLICT(3003, "Kho hàng đang được cập nhật. Vui lòng thử lại sau.", HttpStatus.CONFLICT),

    // ---- Order ----
    ORDER_NOT_FOUND(4001, "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),
    ORDER_CANNOT_BE_CANCELLED(4002, "Không thể hủy đơn hàng ở trạng thái này", HttpStatus.CONFLICT),

    // ---- Payment ----
    PAYMENT_FAILED(5001, "Xử lý thanh toán thất bại", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_SIGNATURE(5002, "Chữ ký thanh toán không hợp lệ", HttpStatus.BAD_REQUEST),

    // ---- Promotion ----
    VOUCHER_NOT_FOUND(6001, "Không tìm thấy mã giảm giá", HttpStatus.NOT_FOUND),
    VOUCHER_EXPIRED(6002, "Mã giảm giá đã hết hạn", HttpStatus.CONFLICT),
    VOUCHER_USED(6003, "Mã giảm giá đã được sử dụng", HttpStatus.CONFLICT);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
