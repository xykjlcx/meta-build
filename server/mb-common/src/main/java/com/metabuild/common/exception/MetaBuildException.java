package com.metabuild.common.exception;

/**
 * 全局异常基类。httpStatus 用 int 而非 Spring HttpStatus，保持 mb-common 零 Spring 依赖。
 */
public abstract class MetaBuildException extends RuntimeException {

    private final String code;
    private final int httpStatus;
    private final Object[] args;

    protected MetaBuildException(String code, int httpStatus, Object... args) {
        super(code);
        this.code = code;
        this.httpStatus = httpStatus;
        this.args = args;
    }

    public String getCode() { return code; }
    public int getHttpStatus() { return httpStatus; }
    public Object[] getArgs() { return args; }
}
