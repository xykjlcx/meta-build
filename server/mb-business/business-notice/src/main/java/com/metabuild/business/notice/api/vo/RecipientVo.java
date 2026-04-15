package com.metabuild.business.notice.api.vo;

import java.time.OffsetDateTime;

/**
 * 接收人视图 DTO（含已读状态）。
 */
public record RecipientVo(Long userId, String username, OffsetDateTime readAt) {}
