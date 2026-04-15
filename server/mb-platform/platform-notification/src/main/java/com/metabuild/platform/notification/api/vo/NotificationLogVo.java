package com.metabuild.platform.notification.api.vo;

import java.time.OffsetDateTime;

/**
 * 通知发送记录视图。
 */
public record NotificationLogVo(
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
