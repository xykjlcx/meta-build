package com.metabuild.platform.notification.domain;

import java.time.OffsetDateTime;

/**
 * 通知发送记录视图。
 */
public record NotificationLogView(
    Long id,
    String channelType,
    Long recipientId,
    String templateCode,
    String module,
    String referenceId,
    short status,
    String errorMessage,
    OffsetDateTime sentAt,
    OffsetDateTime createdAt
) {}
