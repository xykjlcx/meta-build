package com.metabuild.platform.notification.api.dto;

import java.time.OffsetDateTime;

/**
 * 微信绑定状态视图。
 */
public record WeChatBindingView(
    Long id,
    String platform,
    String appId,
    String openId,
    String nickname,
    String avatarUrl,
    OffsetDateTime boundAt
) {}
