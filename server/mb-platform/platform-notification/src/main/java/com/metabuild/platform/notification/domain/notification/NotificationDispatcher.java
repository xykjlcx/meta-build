package com.metabuild.platform.notification.domain.notification;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.domain.log.DeliveryLogService;
import com.metabuild.platform.notification.domain.log.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * 通知分发器：将消息分发到所有支持的渠道。
 *
 * <p>渠道并行执行，单渠道失败不影响其他渠道。
 * 发送结果（成功/失败）写入 notification_log + mb_notification_delivery_log。
 */
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final List<NotificationChannel> channels;
    private final NotificationLogRepository logRepository;
    private final DeliveryLogService deliveryLogService;
    // 字段名 mbAsyncExecutor 与 Bean 名一致，Spring by-name 自动匹配
    private final Executor mbAsyncExecutor;

    /**
     * 分发通知到所有支持的渠道。
     *
     * <p>每个 channel 一个 CompletableFuture，并行执行。
     * 单渠道失败吞异常 + 记录日志，不影响其他渠道。
     */
    public void dispatch(NotificationMessage message) {
        List<NotificationChannel> supportedChannels = channels.stream()
                .filter(ch -> ch.supports(message))
                .toList();

        if (supportedChannels.isEmpty()) {
            log.warn("没有渠道支持此消息: templateCode={}, module={}", message.templateCode(), message.module());
            return;
        }

        List<CompletableFuture<Void>> futures = supportedChannels.stream()
                .map(ch -> CompletableFuture.runAsync(() -> invokeChannel(ch, message), mbAsyncExecutor))
                .toList();

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }

    private void invokeChannel(NotificationChannel channel, NotificationMessage message) {
        long start = System.currentTimeMillis();
        try {
            channel.send(message);
            long durationMs = System.currentTimeMillis() - start;
            logRepository.logSuccess(message, channel.channelType());
            deliveryLogService.record(message, channel.channelType(),
                    DeliveryLogService.STATUS_SUCCESS, durationMs, null);
            log.info("通知发送成功: channel={}, module={}, ref={}, durationMs={}",
                    channel.channelType(), message.module(), message.referenceId(), durationMs);
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            String code = e instanceof NotificationException ne ? ne.getCode() : e.getClass().getSimpleName();
            logRepository.logFailure(message, channel.channelType(), code);
            deliveryLogService.record(message, channel.channelType(),
                    DeliveryLogService.STATUS_FAILED, durationMs, e);
            log.error("通知发送失败: channel={}, module={}, ref={}, code={}, durationMs={}",
                    channel.channelType(), message.module(), message.referenceId(), code, durationMs, e);
        }
    }
}
