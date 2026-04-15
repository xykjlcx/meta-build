package com.metabuild.platform.notification.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.query.SortParser;
import com.metabuild.schema.tables.records.MbNotificationRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbNotification.MB_NOTIFICATION;

/**
 * 通知公告数据访问层（仅 jOOQ）。
 */
@Repository
@RequiredArgsConstructor
public class NotificationRepository {

    private final DSLContext dsl;

    public Optional<MbNotificationRecord> findById(Long id) {
        return dsl.selectFrom(MB_NOTIFICATION)
            .where(MB_NOTIFICATION.ID.eq(id))
            .fetchOptional();
    }

    public PageResult<MbNotificationRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_NOTIFICATION)
            .allow("createdAt", MB_NOTIFICATION.CREATED_AT)
            .defaultSort(MB_NOTIFICATION.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_NOTIFICATION);
        List<MbNotificationRecord> records = dsl.selectFrom(MB_NOTIFICATION)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    public Long insert(MbNotificationRecord record) {
        dsl.insertInto(MB_NOTIFICATION).set(record).execute();
        return record.getId();
    }

    public int update(MbNotificationRecord record) {
        return dsl.update(MB_NOTIFICATION)
            .set(record)
            .where(MB_NOTIFICATION.ID.eq(record.getId()))
            .and(MB_NOTIFICATION.VERSION.eq(record.getVersion() - 1))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_NOTIFICATION).where(MB_NOTIFICATION.ID.eq(id)).execute();
    }
}
