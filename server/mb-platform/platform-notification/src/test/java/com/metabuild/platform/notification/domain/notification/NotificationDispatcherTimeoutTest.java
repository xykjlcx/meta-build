package com.metabuild.platform.notification.domain.notification;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.MbNotificationProperties;
import com.metabuild.platform.notification.domain.log.DeliveryLogRepository;
import com.metabuild.platform.notification.domain.log.DeliveryLogService;
import com.metabuild.platform.notification.domain.log.NotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

/**
 * 验证关键正确性：单渠道超时不影响其他渠道，并且超时被记录到 delivery log。
 */
class NotificationDispatcherTimeoutTest {

    private NotificationLogRepository logRepository;
    private DeliveryLogRepository deliveryLogRepository;
    private DeliveryLogService deliveryLogService;
    private MbNotificationProperties properties;

    @BeforeEach
    void setUp() {
        logRepository = mock(NotificationLogRepository.class);
        deliveryLogRepository = mock(DeliveryLogRepository.class);
        // 同步执行的 DeliveryLogService（绕过 @Async）
        deliveryLogService = new DeliveryLogService(deliveryLogRepository);
        properties = new MbNotificationProperties(
                true,
                new MbNotificationProperties.Timeout(
                        Duration.ofSeconds(2),
                        Duration.ofSeconds(2),
                        Duration.ofSeconds(2),
                        Duration.ofSeconds(2)
                )
        );
    }

    @Test
    void slow_channel_does_not_block_fast_channel_and_is_recorded_as_timeout() {
        Map<String, String> outcomes = new ConcurrentHashMap<>();

        NotificationChannel fastInApp = new NotificationChannel() {
            @Override public String channelType() { return "IN_APP"; }
            @Override public void send(NotificationMessage m) {
                outcomes.put("IN_APP", "sent");
            }
            @Override public boolean supports(NotificationMessage m) { return true; }
        };

        NotificationChannel slowEmail = new NotificationChannel() {
            @Override public String channelType() { return "EMAIL"; }
            @Override public void send(NotificationMessage m) {
                try {
                    Thread.sleep(20_000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                outcomes.put("EMAIL", "should-not-happen");
            }
            @Override public boolean supports(NotificationMessage m) { return true; }
        };

        NotificationDispatcher dispatcher = new NotificationDispatcher(
                List.of(fastInApp, slowEmail),
                logRepository,
                deliveryLogService,
                properties,
                Executors.newFixedThreadPool(4)
        );

        NotificationMessage message = new NotificationMessage(
                0L,
                List.of(1L, 2L),
                "NOTICE_PUBLISHED",
                Map.of("title", "test"),
                "notice",
                "12345"
        );

        long start = System.currentTimeMillis();
        AtomicReference<Throwable> dispatchError = new AtomicReference<>();
        Thread t = new Thread(() -> {
            try {
                dispatcher.dispatch(message);
            } catch (Throwable e) {
                dispatchError.set(e);
            }
        });
        t.start();
        try {
            t.join(5_000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        long elapsed = System.currentTimeMillis() - start;

        // dispatcher 必须在 5s 内返回（超时配置 2s + 余量）
        assertThat(t.isAlive()).as("dispatcher 应在超时 + 余量内返回").isFalse();
        assertThat(elapsed).isLessThan(5_000);
        assertThat(dispatchError.get()).isNull();

        // 快渠道成功
        assertThat(outcomes).containsEntry("IN_APP", "sent");

        // delivery log：成功 + 超时 各一条
        verify(deliveryLogRepository, timeout(2_000)).insert(
                org.mockito.ArgumentMatchers.eq(message),
                org.mockito.ArgumentMatchers.eq("IN_APP"),
                org.mockito.ArgumentMatchers.eq(DeliveryLogService.STATUS_SUCCESS),
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull()
        );
        verify(deliveryLogRepository, timeout(2_000)).insert(
                org.mockito.ArgumentMatchers.eq(message),
                org.mockito.ArgumentMatchers.eq("EMAIL"),
                org.mockito.ArgumentMatchers.eq(DeliveryLogService.STATUS_TIMEOUT),
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }
}
