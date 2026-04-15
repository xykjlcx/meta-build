package com.metabuild.business.notice.web;

import com.metabuild.infra.web.pagination.PageRequestDto;

/**
 * 公告接收人列表请求 DTO。
 */
public class NoticeRecipientsRequestDto extends PageRequestDto {

    private String readStatus;

    public String getReadStatus() {
        return readStatus;
    }

    public void setReadStatus(String readStatus) {
        this.readStatus = readStatus;
    }
}
