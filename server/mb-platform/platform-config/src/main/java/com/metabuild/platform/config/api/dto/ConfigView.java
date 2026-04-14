package com.metabuild.platform.config.api.dto;

import java.time.OffsetDateTime;

/**
 * 系统配置视图 DTO（只读，供响应使用）。
 */
public record ConfigView(
    Long id,
    String configKey,
    String configValue,
    String configType,
    String remark,
    OffsetDateTime updatedAt
) {}
