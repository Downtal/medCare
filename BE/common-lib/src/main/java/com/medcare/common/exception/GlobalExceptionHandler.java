package com.medcare.common.exception;

import com.medcare.common.dto.ApiResponse;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MeterRegistry meterRegistry;

    /**
     * Handle business exceptions (AppException with ErrorCode).
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("[AppException] code={} message={}", ex.getErrorCode().getCode(), ex.getMessage());
        
        // Track business errors
        meterRegistry.counter("medcare.exception.app", 
                "code", ex.getErrorCode().name(),
                "status", String.valueOf(ex.getErrorCode().getHttpStatus().value()))
                .increment();

        ApiResponse<Void> body = ApiResponse.error(ex.getMessage(),
                String.valueOf(ex.getErrorCode().getCode()));
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus()).body(body);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(RuntimeException ex) {
        log.warn("[BadRequest] type={} message={}", ex.getClass().getSimpleName(), ex.getMessage());
        ApiResponse<Void> body = ApiResponse.error(ex.getMessage(), 
                String.valueOf(ErrorCode.VALIDATION_ERROR.getCode()));
        return ResponseEntity.badRequest().body(body);
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
                .message("Dữ liệu không hợp lệ")
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
        log.error("[UnhandledException] type={} message={}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        
        meterRegistry.counter("medcare.exception.unhandled", 
                "type", ex.getClass().getSimpleName())
                .increment();

        ApiResponse<Void> body = ApiResponse.error(
                "Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.",
                String.valueOf(ErrorCode.INTERNAL_SERVER_ERROR.getCode()));
        return ResponseEntity.internalServerError().body(body);
    }
}
