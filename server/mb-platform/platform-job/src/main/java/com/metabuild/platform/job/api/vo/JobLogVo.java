package com.metabuild.platform.job.api.vo;

import java.time.OffsetDateTime;

/**
 * 定时任务日志视图 DTO（只读，供响应使用）。
 */
public record JobLogVo(
    Long id,
    String jobName,
    String status,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    Long durationMs,
    String errorMessage,
    OffsetDateTime createdAt
) {}
