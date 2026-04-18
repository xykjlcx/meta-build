package com.metabuild.platform.notification.domain.log;

import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;

import static com.metabuild.schema.tables.MbNotificationDeliveryLog.MB_NOTIFICATION_DELIVERY_LOG;

/**
 * 通知投递日志 Repository（按渠道维度，区别于按收件人维度的 NotificationLogRepository）。
 */
@Repository
@RequiredArgsConstructor
public class DeliveryLogRepository {

    private final DSLContext dsl;
    private final SnowflakeIdGenerator idGenerator;
    private final Clock clock;

    public void insert(NotificationMessage message,
                       String channel,
                       String status,
                       long durationMs,
                       String errorCode,
                       String errorMessage) {
        Long noticeId = parseNoticeId(message.referenceId());
        String trimmedError = trim(errorMessage, 500);
        dsl.insertInto(MB_NOTIFICATION_DELIVERY_LOG)
                .set(MB_NOTIFICATION_DELIVERY_LOG.ID, idGenerator.nextId())
                .set(MB_NOTIFICATION_DELIVERY_LOG.TENANT_ID, message.tenantId() == null ? 0L : message.tenantId())
                .set(MB_NOTIFICATION_DELIVERY_LOG.NOTICE_ID, noticeId)
                .set(MB_NOTIFICATION_DELIVERY_LOG.MESSAGE_TYPE, message.templateCode())
                .set(MB_NOTIFICATION_DELIVERY_LOG.CHANNEL, channel)
                .set(MB_NOTIFICATION_DELIVERY_LOG.RECIPIENT_COUNT, message.recipientUserIds() == null ? 0 : message.recipientUserIds().size())
                .set(MB_NOTIFICATION_DELIVERY_LOG.STATUS, status)
                .set(MB_NOTIFICATION_DELIVERY_LOG.DURATION_MS, (int) Math.min(durationMs, Integer.MAX_VALUE))
                .set(MB_NOTIFICATION_DELIVERY_LOG.ERROR_CODE, errorCode)
                .set(MB_NOTIFICATION_DELIVERY_LOG.ERROR_MESSAGE, trimmedError)
                .set(MB_NOTIFICATION_DELIVERY_LOG.CREATED_AT, OffsetDateTime.now(clock))
                .execute();
    }

    private Long parseNoticeId(String referenceId) {
        if (referenceId == null || referenceId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(referenceId);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
