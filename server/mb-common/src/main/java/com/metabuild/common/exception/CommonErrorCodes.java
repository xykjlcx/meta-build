package com.metabuild.common.exception;

/**
 * 框架级通用错误码，非业务模块级。
 */
public final class CommonErrorCodes {

    public static final String SYSTEM_INTERNAL = "system.internal";
    public static final String SYSTEM_SERVICE_UNAVAILABLE = "system.serviceUnavailable";
    public static final String SYSTEM_NOT_FOUND = "system.notFound";

    public static final String VALIDATION = "validation";
    public static final String VALIDATION_NOT_NULL = "validation.notNull";
    public static final String VALIDATION_INVALID_FORMAT = "validation.invalidFormat";

    public static final String AUTH_UNAUTHORIZED = "auth.unauthorized";
    public static final String AUTH_FORBIDDEN = "auth.forbidden";
    public static final String AUTH_INVALID_CREDENTIALS = "auth.invalidCredentials";
    public static final String AUTH_ACCOUNT_LOCKED = "auth.accountLocked";
    public static final String AUTH_REFRESH_TOKEN_INVALID = "auth.refreshTokenInvalid";
    public static final String AUTH_ACCOUNT_DISABLED = "auth.accountDisabled";

    public static final String PAGINATION_INVALID_PAGE = "common.pagination.invalidPage";
    public static final String PAGINATION_INVALID_SIZE = "common.pagination.invalidSize";
    public static final String PAGINATION_INVALID_SORT_FIELD = "common.pagination.invalidSortField";

    public static final String NOT_FOUND = "common.notFound";
    public static final String CONFLICT = "common.conflict";
    public static final String OPTIMISTIC_LOCK = "common.optimisticLock";
    public static final String CONCURRENT_MODIFICATION = "common.concurrentModification";

    private CommonErrorCodes() {
    }
}
