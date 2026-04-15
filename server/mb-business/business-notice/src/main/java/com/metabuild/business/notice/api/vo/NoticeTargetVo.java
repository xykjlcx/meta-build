package com.metabuild.business.notice.api.vo;

/**
 * 发送目标视图 DTO（含目标名称，由 JOIN 获取）。
 */
public record NoticeTargetVo(
    String targetType,
    Long targetId,
    String targetName
) {}
