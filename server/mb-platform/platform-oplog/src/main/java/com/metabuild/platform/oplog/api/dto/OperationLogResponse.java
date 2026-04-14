package com.metabuild.platform.oplog.api.dto;

import java.time.OffsetDateTime;

/**
 * 操作日志查询响应 DTO。
 */
public record OperationLogResponse(
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
