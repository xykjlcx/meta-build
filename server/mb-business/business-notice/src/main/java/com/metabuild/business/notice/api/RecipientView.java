package com.metabuild.business.notice.api;

import java.time.OffsetDateTime;

/**
 * 接收人视图 DTO（含已读状态）。
 */
public record RecipientView(Long userId, String username, OffsetDateTime readAt) {}
