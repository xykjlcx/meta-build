package com.metabuild.common.exception;

/**
 * 4xx 业务异常基类。
 */
public class BusinessException extends MetaBuildException {
    public BusinessException(String code, Object... args) {
        super(code, 400, args);
    }

    public BusinessException(String code, Integer httpStatus, Object... args) {
        super(code, httpStatus, args);
    }
}
