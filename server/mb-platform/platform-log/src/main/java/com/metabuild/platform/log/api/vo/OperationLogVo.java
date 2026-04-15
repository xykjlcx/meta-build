package com.metabuild.platform.log.api.vo;

import java.time.OffsetDateTime;

/**
 * 操作日志视图 DTO（只读，供响应使用）。
 */
public record OperationLogVo(
    Long id,
    Long userId,
    String username,
    String module,
    String operation,
    String method,
    String requestUrl,
    String ip,
    Long durationMs,
    Boolean success,
    String errorMessage,
    OffsetDateTime createdAt
) {}
