package com.metabuild.platform.notification.api.vo;

import java.time.OffsetDateTime;

/**
 * 微信绑定状态视图。
 */
public record WeChatBindingVo(
    Long id,
    String platform,
    String appId,
    String openId,
    String nickname,
    String avatarUrl,
    OffsetDateTime boundAt
) {}
