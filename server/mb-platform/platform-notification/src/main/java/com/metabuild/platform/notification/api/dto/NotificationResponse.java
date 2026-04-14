package com.metabuild.platform.notification.api.dto;

import java.time.OffsetDateTime;

/**
 * 通知公告响应 DTO。
 */
public record NotificationResponse(
    Long id,
    String title,
    String content,
    String type,
    Short status,
    Long senderId,
    boolean read,
    OffsetDateTime createdAt
) {}
