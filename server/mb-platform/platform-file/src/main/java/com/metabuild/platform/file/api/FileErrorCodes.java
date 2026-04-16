package com.metabuild.platform.file.api;

/**
 * 文件模块错误码。
 */
public final class FileErrorCodes {

    public static final String DELETE_NOT_ALLOWED = "file.deleteNotAllowed";
    public static final String NOT_FOUND = "file.notFound";
    public static final String TYPE_NOT_ALLOWED = "file.typeNotAllowed";
    public static final String SIZE_EXCEEDED = "file.sizeExceeded";
    public static final String EXTENSION_NOT_ALLOWED = "file.extensionNotAllowed";

    private FileErrorCodes() {
    }
}
