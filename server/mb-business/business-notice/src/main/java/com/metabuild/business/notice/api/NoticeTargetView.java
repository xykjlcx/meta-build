package com.metabuild.business.notice.api;

/**
 * 发送目标视图 DTO（含目标名称，由 JOIN 获取）。
 */
public record NoticeTargetView(
    String targetType,
    Long targetId,
    String targetName
) {}
