package com.metabuild.platform.notification.domain.notification;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.MbNotificationProperties;
import com.metabuild.platform.notification.domain.log.DeliveryLogService;
import com.metabuild.platform.notification.domain.log.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * 通知分发器：将消息分发到所有支持的渠道。
 *
 * <p>渠道并行执行，每个渠道带独立超时（mb.notification.timeout.* 优先于 channel.defaultTimeout()）。
 * 单渠道失败/超时不影响其他渠道。每个渠道的投递结果写入 mb_notification_delivery_log 表。
 */
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final List<NotificationChannel> channels;
    private final NotificationLogRepository logRepository;
    private final DeliveryLogService deliveryLogService;
    private final MbNotificationProperties properties;
    private final Executor mbAsyncExecutor;

    public void dispatch(NotificationMessage message) {
        List<NotificationChannel> supportedChannels = channels.stream()
                .filter(ch -> ch.supports(message))
                .toList();

        if (supportedChannels.isEmpty()) {
            log.warn("没有渠道支持此消息: templateCode={}, module={}", message.templateCode(), message.module());
            return;
        }

        List<String> okChannels = new ArrayList<>();
        List<String> timeoutChannels = new ArrayList<>();
        List<String> failedChannels = new ArrayList<>();

        List<CompletableFuture<Void>> futures = supportedChannels.stream()
                .map(ch -> dispatchOne(ch, message, okChannels, timeoutChannels, failedChannels))
                .toList();

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();

        log.info("通知投递完成 noticeId={} channels=[ok: {}; timeout: {}; failed: {}]",
                message.referenceId(),
                String.join(",", okChannels),
                String.join(",", timeoutChannels),
                String.join(",", failedChannels));
    }

    private CompletableFuture<Void> dispatchOne(NotificationChannel channel,
                                                NotificationMessage message,
                                                List<String> okChannels,
                                                List<String> timeoutChannels,
                                                List<String> failedChannels) {
        long start = System.currentTimeMillis();
        Duration timeout = resolveTimeout(channel);
        return CompletableFuture
                .runAsync(() -> channel.send(message), mbAsyncExecutor)
                .orTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
                .handle((unused, ex) -> {
                    long durationMs = System.currentTimeMillis() - start;
                    Throwable cause = unwrap(ex);
                    if (cause == null) {
                        synchronized (okChannels) { okChannels.add(channel.channelType()); }
                        logRepository.logSuccess(message, channel.channelType());
                        deliveryLogService.record(message, channel.channelType(),
                                DeliveryLogService.STATUS_SUCCESS, durationMs, null);
                        log.info("通知发送成功: channel={}, module={}, ref={}, durationMs={}",
                                channel.channelType(), message.module(), message.referenceId(), durationMs);
                    } else if (cause instanceof TimeoutException) {
                        synchronized (timeoutChannels) { timeoutChannels.add(channel.channelType()); }
                        logRepository.logFailure(message, channel.channelType(), "TIMEOUT");
                        deliveryLogService.record(message, channel.channelType(),
                                DeliveryLogService.STATUS_TIMEOUT, durationMs, cause);
                        log.error("通知渠道超时 channel={} noticeId={} recipientCount={} durationMs={} timeoutMs={}",
                                channel.channelType(), message.referenceId(),
                                message.recipientUserIds() == null ? 0 : message.recipientUserIds().size(),
                                durationMs, timeout.toMillis());
                    } else {
                        synchronized (failedChannels) { failedChannels.add(channel.channelType()); }
                        String code = cause instanceof NotificationException ne ? ne.getCode() : cause.getClass().getSimpleName();
                        logRepository.logFailure(message, channel.channelType(), code);
                        deliveryLogService.record(message, channel.channelType(),
                                DeliveryLogService.STATUS_FAILED, durationMs, cause);
                        log.error("通知渠道失败 channel={} noticeId={} recipientCount={} durationMs={} exceptionType={} message={}",
                                channel.channelType(), message.referenceId(),
                                message.recipientUserIds() == null ? 0 : message.recipientUserIds().size(),
                                durationMs, cause.getClass().getSimpleName(), cause.getMessage());
                    }
                    return null;
                });
    }

    private Duration resolveTimeout(NotificationChannel channel) {
        MbNotificationProperties.Timeout t = properties.timeout();
        return switch (channel.channelType()) {
            case "IN_APP" -> t.inApp();
            case "EMAIL" -> t.email();
            case "WECHAT_MP" -> t.wechatMp();
            case "WECHAT_MINI" -> t.wechatMini();
            default -> channel.defaultTimeout();
        };
    }

    private Throwable unwrap(Throwable t) {
        if (t == null) return null;
        return (t instanceof CompletionException && t.getCause() != null) ? t.getCause() : t;
    }
}
