package com.metabuild.common.exception;

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String code, Object... args) {
        super(code, 403, args);
    }
}
