package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 用户批量更新命令（PATCH 式）。
 *
 * <p>patch 中只更新非 null 字段。支持：
 * <ul>
 *   <li>{@code deptId}：批量移动部门（{@code null} 表示移出部门）</li>
 *   <li>{@code status}：批量启用/禁用（{@code 0} / {@code 1}）</li>
 * </ul>
 *
 * <p>上限 100；超出返回 400 iam.user.batchExceedsLimit。
 */
public record UserBatchPatchCmd(
    @NotEmpty @Size(max = 100) List<Long> ids,
    @Valid @NotNull Patch patch
) {
    public record Patch(
        Long deptId,
        Short status
    ) {
        public boolean isEmpty() {
            return deptId == null && status == null;
        }
    }
}
