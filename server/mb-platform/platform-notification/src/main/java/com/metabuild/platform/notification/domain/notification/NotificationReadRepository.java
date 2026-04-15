package com.metabuild.platform.notification.domain.notification;

import com.metabuild.schema.tables.records.MbNotificationReadRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.Set;
import java.util.stream.Collectors;

import static com.metabuild.schema.tables.MbNotificationRead.MB_NOTIFICATION_READ;

/**
 * 通知已读记录数据访问层（追加表，仅 insert/query）。
 */
@Repository
@RequiredArgsConstructor
public class NotificationReadRepository {

    private final DSLContext dsl;

    public boolean isRead(Long notificationId, Long userId) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_NOTIFICATION_READ)
                .where(MB_NOTIFICATION_READ.NOTIFICATION_ID.eq(notificationId))
                .and(MB_NOTIFICATION_READ.USER_ID.eq(userId))
        );
    }

    public Set<Long> findReadIds(Long userId) {
        return dsl.select(MB_NOTIFICATION_READ.NOTIFICATION_ID)
            .from(MB_NOTIFICATION_READ)
            .where(MB_NOTIFICATION_READ.USER_ID.eq(userId))
            .fetchSet(MB_NOTIFICATION_READ.NOTIFICATION_ID);
    }

    /**
     * 追加一条已读记录（已读过则忽略）。
     */
    public void insert(MbNotificationReadRecord record) {
        dsl.insertInto(MB_NOTIFICATION_READ)
            .set(record)
            .onConflictDoNothing()
            .execute();
    }
}
