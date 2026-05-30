package com.medcare.userservice.exception;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;

public class ResourceNotFoundException extends AppException {
    
    public ResourceNotFoundException(String message) {
        super(ErrorCode.NOT_FOUND, message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(ErrorCode.NOT_FOUND, String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
    }
}
