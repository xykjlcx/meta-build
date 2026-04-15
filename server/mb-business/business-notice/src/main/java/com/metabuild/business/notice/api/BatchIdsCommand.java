package com.metabuild.business.notice.api;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 批量操作命令（通用 ID 列表）。
 */
public record BatchIdsCommand(
    @NotEmpty @Size(max = 100) List<Long> ids
) {}
