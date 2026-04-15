package com.metabuild.business.notice.api;

import jakarta.validation.constraints.NotNull;

/**
 * 发送目标 DTO。
 * <p>
 * targetType: ALL=全员, DEPT=部门, ROLE=角色, USER=指定用户。
 * targetId: ALL 时为 null，其余为对应的 ID。
 */
public record NoticeTarget(
    @NotNull String targetType,
    Long targetId
) {}
