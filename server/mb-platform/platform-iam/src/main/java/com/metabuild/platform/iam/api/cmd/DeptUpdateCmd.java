package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新部门命令。
 * parentId=null 表示移到根；status 不在此处修改（见 ADR 决策：部门启停用通过删除表达）。
 */
public record DeptUpdateCmd(
    Long parentId,
    @NotBlank @Size(max = 128) String name,
    Long leaderUserId,
    Integer sortOrder
) {}
