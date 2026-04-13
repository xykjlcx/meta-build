package com.metabuild.common.exception;

public class ConflictException extends BusinessException {
    public ConflictException(String code, Object... args) {
        super(code, 409, args);
    }
}
