package com.metabuild.platform.config.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 设置/更新系统配置命令。
 */
public record ConfigSetCommand(
    @NotBlank @Size(max = 128) String configKey,
    String configValue,
    @Size(max = 32) String configType,
    @Size(max = 512) String remark
) {}
