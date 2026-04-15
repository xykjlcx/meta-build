package com.metabuild.business.notice.api;

import java.time.OffsetDateTime;
/**
 * 公告查询参数。
 */
public record NoticeQuery(
    Short status,
    String keyword,
    OffsetDateTime startTimeFrom,
    OffsetDateTime startTimeTo
) {}
