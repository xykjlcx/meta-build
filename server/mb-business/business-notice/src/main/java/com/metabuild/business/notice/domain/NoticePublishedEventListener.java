package com.metabuild.business.notice.domain;

import com.metabuild.platform.notification.api.NotificationApi;
import com.metabuild.platform.notification.api.dto.NotificationCreateCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 公告发布事件监听器。
 * <p>
 * 事务提交后异步触发，调用 platform-notification 模块创建站内通知。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NoticePublishedEventListener {

    private final NotificationApi notificationApi;

    /**
     * 监听公告发布事件，为每个接收人创建一条站内通知。
     * <p>
     * 使用 @TransactionalEventListener(AFTER_COMMIT) 确保只在事务成功后触发，
     * 配合 @Async 异步执行，不阻塞发布主流程。
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onNoticePublished(NoticePublishedEvent event) {
        log.info("处理公告发布事件: noticeId={}, 接收人数={}", event.noticeId(), event.recipientUserIds().size());

        try {
            // 创建一条系统通知（公告关联），通知标题引用公告标题
            var command = new NotificationCreateCommand(
                "公告通知：" + event.title(),
                "您收到一条新公告，请及时查看。",
                "NOTICE"
            );
            notificationApi.create(command);
            log.info("公告发布通知已创建: noticeId={}", event.noticeId());
        } catch (Exception e) {
            // 异步操作失败不影响发布结果，仅记录日志
            log.error("创建公告发布通知失败: noticeId={}", event.noticeId(), e);
        }
    }
}
