package com.metabuild.common.exception;

public class TooManyRequestsException extends BusinessException {
    public TooManyRequestsException(String code, Object... args) {
        super(code, 429, args);
    }
}
