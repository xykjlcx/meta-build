package com.metabuild.business.notice.api;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 公告查询参数。
 */
public record NoticeQuery(
    Short status,
    String keyword,
    OffsetDateTime startTimeFrom,
    OffsetDateTime startTimeTo,
    int page,
    int size,
    List<String> sort
) {
    public int offset() {
        return (page - 1) * size;
    }
}
