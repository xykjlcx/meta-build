package com.metabuild.platform.notification.api;

/**
 * 通知模块错误码。
 */
public final class NotificationErrorCodes {

    public static final String NOTIFICATION_NOT_FOUND = "notification.notFound";
    public static final String IN_APP_BROADCAST_FAILED = "notification.inAppBroadcastFailed";
    public static final String MP_ACCESS_TOKEN_FAILED = "notification.mpAccessTokenFailed";
    public static final String MINI_ACCESS_TOKEN_FAILED = "notification.miniAccessTokenFailed";
    public static final String MP_TOKEN_EXCHANGE_FAILED = "notification.mpTokenExchangeFailed";
    public static final String MINI_SESSION_EXCHANGE_FAILED = "notification.miniSessionExchangeFailed";
    public static final String WECHAT_STATE_INVALID = "notification.wechatStateInvalid";
    public static final String WECHAT_PLATFORM_INVALID = "notification.wechatPlatformInvalid";
    public static final String WECHAT_BINDING_NOT_FOUND = "notification.wechatBindingNotFound";

    private NotificationErrorCodes() {
    }
}
