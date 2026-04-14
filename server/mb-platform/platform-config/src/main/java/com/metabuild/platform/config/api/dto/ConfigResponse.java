package com.metabuild.platform.config.api.dto;

import java.time.OffsetDateTime;

/**
 * 系统配置响应 DTO。
 */
public record ConfigResponse(
    Long id,
    String configKey,
    String configValue,
    String configType,
    String remark,
    OffsetDateTime updatedAt
) {}
