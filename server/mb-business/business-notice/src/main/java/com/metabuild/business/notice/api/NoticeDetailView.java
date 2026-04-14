package com.metabuild.business.notice.api;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 公告详情视图 DTO。
 */
public record NoticeDetailView(
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
    List<AttachmentView> attachments,
    List<TargetView> targets
) {

    /**
     * 附件视图。
     */
    public record AttachmentView(
        Long fileId,
        Integer sortOrder
    ) {}

    /**
     * 发送目标视图。
     */
    public record TargetView(
        String targetType,
        Long targetId
    ) {}
}
