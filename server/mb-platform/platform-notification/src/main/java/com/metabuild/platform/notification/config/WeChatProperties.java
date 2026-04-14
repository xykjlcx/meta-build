package com.metabuild.platform.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 微信配置属性。
 *
 * <p>配置前缀：mb.wechat
 * <p>appId/appSecret 未配置时对应渠道自动跳过。
 */
@ConfigurationProperties(prefix = "mb.wechat")
@Validated
public record WeChatProperties(
    MpConfig mp,
    MiniConfig mini
) {
    public WeChatProperties {
        if (mp == null) mp = new MpConfig("", "", "");
        if (mini == null) mini = new MiniConfig("", "", "");
    }

    /**
     * 微信公众号配置。
     */
    public record MpConfig(
        String appId,
        String appSecret,
        String templateNotice
    ) {
        public MpConfig {
            if (appId == null) appId = "";
            if (appSecret == null) appSecret = "";
            if (templateNotice == null) templateNotice = "";
        }

        /** 是否已配置（appId 和 appSecret 非空） */
        public boolean isConfigured() {
            return !appId.isBlank() && !appSecret.isBlank();
        }
    }

    /**
     * 微信小程序配置。
     */
    public record MiniConfig(
        String appId,
        String appSecret,
        String templateNotice
    ) {
        public MiniConfig {
            if (appId == null) appId = "";
            if (appSecret == null) appSecret = "";
            if (templateNotice == null) templateNotice = "";
        }

        /** 是否已配置 */
        public boolean isConfigured() {
            return !appId.isBlank() && !appSecret.isBlank();
        }
    }
}
