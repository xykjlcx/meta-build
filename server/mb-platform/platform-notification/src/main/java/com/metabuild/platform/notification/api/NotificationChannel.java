package com.metabuild.platform.notification.api;

/**
 * 通知渠道接口（Strategy 模式）。
 *
 * <p>每个渠道实现负责特定的消息投递方式（站内信、邮件、微信等）。
 * {@link #supports(NotificationMessage)} 返回 false 时该渠道被跳过。
 */
public interface NotificationChannel {

    /**
     * 渠道类型标识。
     *
     * @return "IN_APP" / "EMAIL" / "WECHAT_MP" / "WECHAT_MINI"
     */
    String channelType();

    /**
     * 发送通知。
     *
     * @param message 通知消息
     * @throws NotificationException 发送失败时抛出
     */
    void send(NotificationMessage message) throws NotificationException;

    /**
     * 判断该渠道是否支持发送此消息。
     *
     * <p>常见判断：环境变量是否配置、接收人是否有对应绑定关系等。
     *
     * @param message 通知消息
     * @return true=支持发送
     */
    boolean supports(NotificationMessage message);
}
