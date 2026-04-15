package com.metabuild.platform.notification.api.vo;

import java.time.OffsetDateTime;

/**
 * 通知公告视图 DTO（只读，供响应使用）。
 */
public record NotificationVo(
    Long id,
    String title,
    String content,
    String type,
    Short status,
    Long senderId,
    boolean read,
    OffsetDateTime createdAt
) {}
