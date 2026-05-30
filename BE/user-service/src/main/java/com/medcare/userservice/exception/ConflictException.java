package com.medcare.userservice.exception;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;

public class ConflictException extends AppException {
    
    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }
}
