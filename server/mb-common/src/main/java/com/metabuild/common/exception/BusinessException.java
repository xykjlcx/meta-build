package com.metabuild.common.exception;

/**
 * 4xx 业务异常基类。
 */
public class BusinessException extends MetaBuildException {
    public BusinessException(String code, int httpStatus, Object... args) {
        super(code, httpStatus, args);
    }
}
