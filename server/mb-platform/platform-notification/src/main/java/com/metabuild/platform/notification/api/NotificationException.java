package com.metabuild.platform.notification.api;

/**
 * 通知发送异常。
 *
 * <p>各渠道实现在发送失败时抛出此异常。
 * {@link com.metabuild.platform.notification.domain.notification.NotificationDispatcher} 会捕获并记录日志，
 * 单渠道失败不影响其他渠道。
 */
public class NotificationException extends RuntimeException {

    public NotificationException(String message) {
        super(message);
    }

    public NotificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
