package com.metabuild.common.exception;

public class UnauthorizedException extends BusinessException {
    public UnauthorizedException(String code, Object... args) {
        super(code, 401, args);
    }
}
