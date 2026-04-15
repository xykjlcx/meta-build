package com.metabuild.business.notice.api;

import java.time.OffsetDateTime;

/**
 * 公告列表视图 DTO。
 */
public record NoticeView(
    Long id,
    String title,
    Short status,
    Boolean pinned,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    String createdByName,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Boolean read,
    Integer readCount,
    Integer recipientCount
) {}
