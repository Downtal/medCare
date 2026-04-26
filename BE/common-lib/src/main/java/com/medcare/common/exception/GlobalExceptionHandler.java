package com.medcare.common.exception;

import com.medcare.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle business exceptions (AppException with ErrorCode).
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("[AppException] code={} message={}", ex.getErrorCode().getCode(), ex.getMessage());
        ApiResponse<Void> body = ApiResponse.error(ex.getMessage(),
                String.valueOf(ex.getErrorCode().getCode()));
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus()).body(body);
    }

    /**
     * Handle @Valid / @Validated constraint violations (field-level errors).
     * Returns a map of fieldName -> errorMessage inside the "data" field.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getAllErrors().stream()
                .filter(e -> e instanceof FieldError)
                .map(e -> (FieldError) e)
                .collect(Collectors.toMap(FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (a, b) -> a));

        log.warn("[Validation] errors={}", errors);
        ApiResponse<Map<String, String>> body = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .errorCode(String.valueOf(ErrorCode.VALIDATION_ERROR.getCode()))
                .data(errors)
                .build();
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Catch-all for unhandled exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("[UnhandledException] {}", ex.getMessage(), ex);
        ApiResponse<Void> body = ApiResponse.error(
                "An unexpected error occurred. Please try again later.",
                String.valueOf(ErrorCode.INTERNAL_SERVER_ERROR.getCode()));
        return ResponseEntity.internalServerError().body(body);
    }
}
