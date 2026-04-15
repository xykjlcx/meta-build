package com.metabuild.platform.notification.domain.notification;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
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
 * 发送结果（成功/失败）写入 notification_log 表。
 */
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final List<NotificationChannel> channels;
    private final NotificationLogRepository logRepository;
    // 字段名 mbAsyncExecutor 与 Bean 名一致，Spring by-name 自动匹配
    // 不使用 @Qualifier（Lombok @RequiredArgsConstructor 不会把 @Qualifier 传到构造器参数上）
    private final Executor mbAsyncExecutor;

    /**
     * 分发通知到所有支持的渠道。
     *
     * <p>每个 channel 一个 CompletableFuture，并行执行。
     * 单渠道失败吞异常 + 记录日志，不影响其他渠道。
     *
     * @param message 通知消息
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
                .map(ch -> CompletableFuture.runAsync(() -> {
                    try {
                        ch.send(message);
                        logRepository.logSuccess(message, ch.channelType());
                        log.info("通知发送成功: channel={}, module={}, ref={}",
                                ch.channelType(), message.module(), message.referenceId());
                    } catch (NotificationException e) {
                        logRepository.logFailure(message, ch.channelType(), e.getMessage());
                        log.error("通知发送失败: channel={}, module={}, ref={}, error={}",
                                ch.channelType(), message.module(), message.referenceId(), e.getMessage());
                    }
                }, mbAsyncExecutor))
                .toList();

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }
}
