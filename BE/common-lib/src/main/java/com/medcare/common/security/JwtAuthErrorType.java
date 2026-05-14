package com.medcare.common.security;

public enum JwtAuthErrorType {
    TOKEN_EXPIRED("TOKEN_EXPIRED", "Access token has expired"),
    TOKEN_INVALID("TOKEN_INVALID", "Access token is invalid"),
    TOKEN_UNSUPPORTED("TOKEN_UNSUPPORTED", "Access token type is not supported"),
    TOKEN_MISSING_OR_EMPTY("TOKEN_MISSING_OR_EMPTY", "Access token is missing or empty");

    private final String code;
    private final String message;

    JwtAuthErrorType(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
