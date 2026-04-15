package com.metabuild.business.notice.api.qry;

import java.time.OffsetDateTime;
/**
 * 公告查询参数。
 */
public record NoticeQry(
    Short status,
    String keyword,
    OffsetDateTime startTimeFrom,
    OffsetDateTime startTimeTo
) {}
