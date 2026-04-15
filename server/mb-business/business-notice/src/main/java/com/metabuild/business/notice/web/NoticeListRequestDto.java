package com.metabuild.business.notice.web;

import com.metabuild.infra.web.pagination.PageRequestDto;

import java.time.OffsetDateTime;

/**
 * 公告列表请求 DTO。
 */
public class NoticeListRequestDto extends PageRequestDto {

    private Short status;
    private String keyword;
    private OffsetDateTime startTimeFrom;
    private OffsetDateTime startTimeTo;

    public Short getStatus() {
        return status;
    }

    public void setStatus(Short status) {
        this.status = status;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public OffsetDateTime getStartTimeFrom() {
        return startTimeFrom;
    }

    public void setStartTimeFrom(OffsetDateTime startTimeFrom) {
        this.startTimeFrom = startTimeFrom;
    }

    public OffsetDateTime getStartTimeTo() {
        return startTimeTo;
    }

    public void setStartTimeTo(OffsetDateTime startTimeTo) {
        this.startTimeTo = startTimeTo;
    }
}
