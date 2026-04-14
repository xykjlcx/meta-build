package com.metabuild.business.notice.domain;

import java.util.List;

/**
 * 公告发布事件。
 * <p>
 * 在事务提交后由 {@link NoticePublishedEventListener} 异步消费，
 * 用于通知接收人（站内信 / 推送等）。
 */
public record NoticePublishedEvent(
    Long noticeId,
    String title,
    List<Long> recipientUserIds
) {}
