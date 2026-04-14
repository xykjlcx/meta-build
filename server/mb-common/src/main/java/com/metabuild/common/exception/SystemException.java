package com.metabuild.common.exception;

/**
 * 5xx 系统异常。
 */
public class SystemException extends MetaBuildException {
    public SystemException(String code, Object... args) {
        super(code, 500, args);
    }
}
