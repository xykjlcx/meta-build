package com.metabuild.common.exception;

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, Object... args) {
        super(code, 404, args);
    }
}
