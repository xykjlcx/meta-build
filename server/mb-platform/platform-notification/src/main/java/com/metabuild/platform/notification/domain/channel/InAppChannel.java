package com.metabuild.platform.notification.domain.channel;

import com.metabuild.infra.sse.SseMessageSender;
import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationErrorCodes;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;

/**
 * 站内信 + SSE 推送渠道。
 *
 * <p>职责：通过 SSE 广播 notice-published 事件给在线用户。
 * 不写 biz_notice_recipient 表（那是 business 层 NoticeService.publish() 的事）。
 *
 * <p>前端收到事件后 toast + invalidateQueries(['notices', 'unread-count'])。
 */
@Component
@RequiredArgsConstructor
public class InAppChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(InAppChannel.class);

    private final SseMessageSender sseMessageSender;

    @Override
    public String channelType() {
        return "IN_APP";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        try {
            String title = message.params().getOrDefault("title", "");
            sseMessageSender.broadcast("notice-published", Map.of(
                    "module", message.module(),
                    "referenceId", message.referenceId(),
                    "title", title
            ));
            log.info("站内信 SSE 广播完成: module={}, ref={}", message.module(), message.referenceId());
        } catch (Exception e) {
            throw new NotificationException(NotificationErrorCodes.IN_APP_BROADCAST_FAILED, e);
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        // 站内信渠道始终可用（不依赖外部配置）
        return true;
    }

    @Override
    public Duration defaultTimeout() {
        return Duration.ofSeconds(2);
    }
}
