package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 用户批量更新结果。
 *
 * <p>v1 采用全量事务模式：任一失败整体回滚（业务异常直接抛出），{@code failed} 恒为空数组。
 * 保留 failed 字段结构是为未来切"尽力而为"模式保留 schema 兼容（ADR backend-0026 决策）。
 */
public record UserBatchResultVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    int updated,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    List<FailedItem> failed
) {
    public record FailedItem(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String code,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String message
    ) {}
}
