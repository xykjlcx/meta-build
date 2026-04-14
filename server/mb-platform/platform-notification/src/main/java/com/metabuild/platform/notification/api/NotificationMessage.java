package com.metabuild.platform.notification.api;

import java.util.List;
import java.util.Map;

/**
 * 通知消息（渠道无关）。
 *
 * <p>由业务层构建，交给 {@link NotificationChannel} 分发。
 * 不同渠道根据 templateCode + params 渲染各自的消息格式。
 */
public record NotificationMessage(
    Long tenantId,
    List<Long> recipientUserIds,
    String templateCode,
    Map<String, String> params,
    String module,
    String referenceId
) {}
