package com.metabuild.platform.notification.domain;

import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import static com.metabuild.schema.tables.MbNotificationLog.MB_NOTIFICATION_LOG;

/**
 * 通知发送记录 Repository。
 */
@Repository
@RequiredArgsConstructor
public class NotificationLogRepository {

    private final DSLContext dsl;
    private final SnowflakeIdGenerator idGenerator;
    private final Clock clock;

    /**
     * 记录发送成功。
     *
     * @param message     通知消息
     * @param channelType 渠道类型
     */
    public void logSuccess(NotificationMessage message, String channelType) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Long> recipients = message.recipientUserIds();
        // 批量插入每个接收人的成功记录
        var batch = recipients.stream()
                .map(recipientId -> dsl.insertInto(MB_NOTIFICATION_LOG)
                        .set(MB_NOTIFICATION_LOG.ID, idGenerator.nextId())
                        .set(MB_NOTIFICATION_LOG.TENANT_ID, message.tenantId())
                        .set(MB_NOTIFICATION_LOG.CHANNEL_TYPE, channelType)
                        .set(MB_NOTIFICATION_LOG.RECIPIENT_ID, recipientId)
                        .set(MB_NOTIFICATION_LOG.TEMPLATE_CODE, message.templateCode())
                        .set(MB_NOTIFICATION_LOG.MODULE, message.module())
                        .set(MB_NOTIFICATION_LOG.REFERENCE_ID, message.referenceId())
                        .set(MB_NOTIFICATION_LOG.STATUS, (short) 1)
                        .set(MB_NOTIFICATION_LOG.SENT_AT, now)
                        .set(MB_NOTIFICATION_LOG.CREATED_AT, now))
                .toList();
        dsl.batch(batch).execute();
    }

    /**
     * 记录发送失败。
     *
     * @param message      通知消息
     * @param channelType  渠道类型
     * @param errorMessage 失败原因
     */
    public void logFailure(NotificationMessage message, String channelType, String errorMessage) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Long> recipients = message.recipientUserIds();
        var batch = recipients.stream()
                .map(recipientId -> dsl.insertInto(MB_NOTIFICATION_LOG)
                        .set(MB_NOTIFICATION_LOG.ID, idGenerator.nextId())
                        .set(MB_NOTIFICATION_LOG.TENANT_ID, message.tenantId())
                        .set(MB_NOTIFICATION_LOG.CHANNEL_TYPE, channelType)
                        .set(MB_NOTIFICATION_LOG.RECIPIENT_ID, recipientId)
                        .set(MB_NOTIFICATION_LOG.TEMPLATE_CODE, message.templateCode())
                        .set(MB_NOTIFICATION_LOG.MODULE, message.module())
                        .set(MB_NOTIFICATION_LOG.REFERENCE_ID, message.referenceId())
                        .set(MB_NOTIFICATION_LOG.STATUS, (short) 2)
                        .set(MB_NOTIFICATION_LOG.ERROR_MESSAGE, errorMessage)
                        .set(MB_NOTIFICATION_LOG.CREATED_AT, now))
                .toList();
        dsl.batch(batch).execute();
    }

    /**
     * 按模块 + 关联 ID 查询发送记录。
     */
    public List<NotificationLogView> findByModuleAndRef(String module, String referenceId) {
        return dsl.selectFrom(MB_NOTIFICATION_LOG)
                .where(MB_NOTIFICATION_LOG.MODULE.eq(module))
                .and(MB_NOTIFICATION_LOG.REFERENCE_ID.eq(referenceId))
                .orderBy(MB_NOTIFICATION_LOG.CREATED_AT.desc())
                .fetchInto(NotificationLogView.class);
    }
}
