package com.metabuild.business.notice.api.vo;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 公告详情视图 DTO。
 */
public record NoticeDetailVo(
    Long id,
    String title,
    String content,
    Short status,
    Boolean pinned,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    String createdByName,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Integer version,
    Boolean read,
    Integer readCount,
    Integer recipientCount,
    List<AttachmentVo> attachments,
    List<TargetVo> targets
) {

    /**
     * 附件视图。
     */
    public record AttachmentVo(
        Long fileId,
        Integer sortOrder
    ) {}

    /**
     * 发送目标视图。
     */
    public record TargetVo(
        String targetType,
        Long targetId
    ) {}
}
