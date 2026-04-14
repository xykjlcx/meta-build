package com.metabuild.platform.job.api.dto;

import java.time.OffsetDateTime;

/**
 * 定时任务日志响应 DTO。
 */
public record JobLogResponse(
    Long id,
    String jobName,
    String status,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    Long durationMs,
    String errorMessage,
    OffsetDateTime createdAt
) {}
