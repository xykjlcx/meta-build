package com.metabuild.business.notice.domain.event;

import com.metabuild.platform.notification.api.NotificationApi;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/**
 * 公告发布事件监听器。
 *
 * <p>事务提交后异步触发，调用 NotificationDispatcher 分发到所有配置的渠道
 * （站内信 SSE + 邮件 + 微信公众号 + 微信小程序）。
 *
 * <p>替换 Plan A 中的简单 NotificationApi.create()，
 * 升级为完整的多渠道通知分发。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NoticePublishedEventListener {

    private final NotificationApi notificationApi;

    /**
     * 监听公告发布事件，分发通知到所有支持的渠道。
     *
     * <p>使用 @TransactionalEventListener(AFTER_COMMIT) 确保只在事务成功后触发，
     * 配合 @Async 异步执行，不阻塞发布主流程。
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onNoticePublished(NoticePublishedEvent event) {
        log.info("处理公告发布事件: noticeId={}, 接收人数={}", event.noticeId(), event.recipientUserIds().size());

        try {
            NotificationMessage message = new NotificationMessage(
                    0L, // tenantId（v1 默认 0）
                    event.recipientUserIds(),
                    "notice_published",
                    Map.of("title", event.title()),
                    "notice",
                    String.valueOf(event.noticeId())
            );
            notificationApi.dispatch(message);
            log.info("公告通知分发完成: noticeId={}", event.noticeId());
        } catch (Exception e) {
            // 异步操作失败不影响发布结果，仅记录日志
            log.error("公告通知分发失败: noticeId={}", event.noticeId(), e);
        }
    }
}
