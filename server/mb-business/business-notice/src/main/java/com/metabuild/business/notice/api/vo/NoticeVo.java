package com.metabuild.business.notice.api.vo;

import java.time.OffsetDateTime;

/**
 * 公告列表视图 DTO。
 */
public record NoticeVo(
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
