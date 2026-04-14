package com.metabuild.business.notice.domain;

import com.metabuild.business.notice.api.NoticeDetailView;
import com.metabuild.business.notice.api.NoticeQuery;
import com.metabuild.business.notice.api.NoticeTarget;
import com.metabuild.business.notice.api.NoticeView;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.infra.jooq.SortParser;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.BizNotice.BIZ_NOTICE;
import static com.metabuild.schema.tables.BizNoticeAttachment.BIZ_NOTICE_ATTACHMENT;
import static com.metabuild.schema.tables.BizNoticeRecipient.BIZ_NOTICE_RECIPIENT;
import static com.metabuild.schema.tables.BizNoticeTarget.BIZ_NOTICE_TARGET;
import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 公告数据访问层。
 * <p>
 * 所有 jOOQ 查询封装在此处，对 Service 层只暴露 DTO，不泄漏 jOOQ 类型。
 */
@Repository
@RequiredArgsConstructor
public class NoticeRepository {

    private final DSLContext dsl;
    private final Clock clock;
    private final SnowflakeIdGenerator idGenerator;

    /**
     * 分页查询公告列表。
     * <p>
     * LEFT JOIN recipient 获取当前用户已读状态，子查询获取已读数/接收人数。
     */
    public PageResult<NoticeView> findPage(NoticeQuery query, Long currentUserId) {
        // 构建动态查询条件
        var conditions = buildConditions(query);

        // 已读数子查询
        var readCountField = DSL.field(
            DSL.select(DSL.count())
                .from(BIZ_NOTICE_RECIPIENT)
                .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(BIZ_NOTICE.ID))
                .and(BIZ_NOTICE_RECIPIENT.READ_AT.isNotNull())
        ).as("read_count");

        // 接收人总数子查询
        var recipientCountField = DSL.field(
            DSL.select(DSL.count())
                .from(BIZ_NOTICE_RECIPIENT)
                .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(BIZ_NOTICE.ID))
        ).as("recipient_count");

        // 当前用户已读状态子查询
        var readField = DSL.field(
            DSL.exists(
                DSL.selectOne()
                    .from(BIZ_NOTICE_RECIPIENT)
                    .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(BIZ_NOTICE.ID))
                    .and(BIZ_NOTICE_RECIPIENT.USER_ID.eq(currentUserId))
                    .and(BIZ_NOTICE_RECIPIENT.READ_AT.isNotNull())
            )
        ).as("read");

        // 排序
        var sortFields = SortParser.builder()
            .forTable(BIZ_NOTICE)
            .allow("title", BIZ_NOTICE.TITLE)
            .allow("status", BIZ_NOTICE.STATUS)
            .allow("pinned", BIZ_NOTICE.PINNED)
            .allow("startTime", BIZ_NOTICE.START_TIME)
            .defaultSort(BIZ_NOTICE.CREATED_AT.desc())
            .parse(query.sort());

        // 总数
        long total = dsl.selectCount()
            .from(BIZ_NOTICE)
            .where(conditions)
            .fetchOne(0, long.class);

        // 分页查询
        var records = dsl.select(
                BIZ_NOTICE.ID,
                BIZ_NOTICE.TITLE,
                BIZ_NOTICE.STATUS,
                BIZ_NOTICE.PINNED,
                BIZ_NOTICE.START_TIME,
                BIZ_NOTICE.END_TIME,
                MB_IAM_USER.NICKNAME.as("created_by_name"),
                BIZ_NOTICE.CREATED_AT,
                BIZ_NOTICE.UPDATED_AT,
                readField,
                readCountField,
                recipientCountField
            )
            .from(BIZ_NOTICE)
            .leftJoin(MB_IAM_USER).on(BIZ_NOTICE.CREATED_BY.eq(MB_IAM_USER.ID))
            .where(conditions)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        List<NoticeView> content = records.map(r -> new NoticeView(
            r.get(BIZ_NOTICE.ID),
            r.get(BIZ_NOTICE.TITLE),
            r.get(BIZ_NOTICE.STATUS),
            r.get(BIZ_NOTICE.PINNED),
            r.get(BIZ_NOTICE.START_TIME),
            r.get(BIZ_NOTICE.END_TIME),
            r.get("created_by_name", String.class),
            r.get(BIZ_NOTICE.CREATED_AT),
            r.get(BIZ_NOTICE.UPDATED_AT),
            r.get("read", Boolean.class),
            r.get("read_count", Integer.class),
            r.get("recipient_count", Integer.class)
        ));

        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / query.size());
        return new PageResult<>(content, total, totalPages, query.page(), query.size());
    }

    /**
     * 根据 ID 查询公告详情（含附件和发送目标）。
     */
    public Optional<NoticeDetailView> findById(Long id, Long currentUserId) {
        // 已读数
        var readCountField = DSL.field(
            DSL.select(DSL.count())
                .from(BIZ_NOTICE_RECIPIENT)
                .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(BIZ_NOTICE.ID))
                .and(BIZ_NOTICE_RECIPIENT.READ_AT.isNotNull())
        ).as("read_count");

        // 接收人总数
        var recipientCountField = DSL.field(
            DSL.select(DSL.count())
                .from(BIZ_NOTICE_RECIPIENT)
                .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(BIZ_NOTICE.ID))
        ).as("recipient_count");

        // 当前用户已读状态
        var readField = DSL.field(
            DSL.exists(
                DSL.selectOne()
                    .from(BIZ_NOTICE_RECIPIENT)
                    .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(BIZ_NOTICE.ID))
                    .and(BIZ_NOTICE_RECIPIENT.USER_ID.eq(currentUserId))
                    .and(BIZ_NOTICE_RECIPIENT.READ_AT.isNotNull())
            )
        ).as("read");

        var record = dsl.select(
                BIZ_NOTICE.ID,
                BIZ_NOTICE.TITLE,
                BIZ_NOTICE.CONTENT,
                BIZ_NOTICE.STATUS,
                BIZ_NOTICE.PINNED,
                BIZ_NOTICE.START_TIME,
                BIZ_NOTICE.END_TIME,
                MB_IAM_USER.NICKNAME.as("created_by_name"),
                BIZ_NOTICE.CREATED_AT,
                BIZ_NOTICE.UPDATED_AT,
                BIZ_NOTICE.VERSION,
                readField,
                readCountField,
                recipientCountField
            )
            .from(BIZ_NOTICE)
            .leftJoin(MB_IAM_USER).on(BIZ_NOTICE.CREATED_BY.eq(MB_IAM_USER.ID))
            .where(BIZ_NOTICE.ID.eq(id))
            .fetchOne();

        if (record == null) {
            return Optional.empty();
        }

        // 查询附件
        List<NoticeDetailView.AttachmentView> attachments = dsl
            .select(BIZ_NOTICE_ATTACHMENT.FILE_ID, BIZ_NOTICE_ATTACHMENT.SORT_ORDER)
            .from(BIZ_NOTICE_ATTACHMENT)
            .where(BIZ_NOTICE_ATTACHMENT.NOTICE_ID.eq(id))
            .orderBy(BIZ_NOTICE_ATTACHMENT.SORT_ORDER.asc())
            .fetch()
            .map(r -> new NoticeDetailView.AttachmentView(
                r.get(BIZ_NOTICE_ATTACHMENT.FILE_ID),
                r.get(BIZ_NOTICE_ATTACHMENT.SORT_ORDER)
            ));

        // 查询发送目标
        List<NoticeDetailView.TargetView> targets = dsl
            .select(BIZ_NOTICE_TARGET.TARGET_TYPE, BIZ_NOTICE_TARGET.TARGET_ID)
            .from(BIZ_NOTICE_TARGET)
            .where(BIZ_NOTICE_TARGET.NOTICE_ID.eq(id))
            .fetch()
            .map(r -> new NoticeDetailView.TargetView(
                r.get(BIZ_NOTICE_TARGET.TARGET_TYPE),
                r.get(BIZ_NOTICE_TARGET.TARGET_ID)
            ));

        return Optional.of(new NoticeDetailView(
            record.get(BIZ_NOTICE.ID),
            record.get(BIZ_NOTICE.TITLE),
            record.get(BIZ_NOTICE.CONTENT),
            record.get(BIZ_NOTICE.STATUS),
            record.get(BIZ_NOTICE.PINNED),
            record.get(BIZ_NOTICE.START_TIME),
            record.get(BIZ_NOTICE.END_TIME),
            record.get("created_by_name", String.class),
            record.get(BIZ_NOTICE.CREATED_AT),
            record.get(BIZ_NOTICE.UPDATED_AT),
            record.get(BIZ_NOTICE.VERSION),
            record.get("read", Boolean.class),
            record.get("read_count", Integer.class),
            record.get("recipient_count", Integer.class),
            attachments,
            targets
        ));
    }

    /**
     * 内部快照 DTO，用于 Service 层做状态校验等逻辑，不暴露 jOOQ Record。
     */
    public record NoticeSnapshot(
        Long id, Short status, String title, String content,
        Boolean pinned, OffsetDateTime startTime, OffsetDateTime endTime
    ) {}

    /**
     * 根据 ID 查询公告快照（内部使用，不泄漏 jOOQ 类型）。
     */
    public Optional<NoticeSnapshot> findSnapshotById(Long id) {
        return dsl.select(
                BIZ_NOTICE.ID, BIZ_NOTICE.STATUS, BIZ_NOTICE.TITLE, BIZ_NOTICE.CONTENT,
                BIZ_NOTICE.PINNED, BIZ_NOTICE.START_TIME, BIZ_NOTICE.END_TIME
            )
            .from(BIZ_NOTICE)
            .where(BIZ_NOTICE.ID.eq(id))
            .fetchOptional(r -> new NoticeSnapshot(
                r.get(BIZ_NOTICE.ID), r.get(BIZ_NOTICE.STATUS), r.get(BIZ_NOTICE.TITLE),
                r.get(BIZ_NOTICE.CONTENT), r.get(BIZ_NOTICE.PINNED),
                r.get(BIZ_NOTICE.START_TIME), r.get(BIZ_NOTICE.END_TIME)
            ));
    }

    /**
     * 插入公告。
     */
    public void insert(Long id, Long tenantId, String title, String content, short status,
                       Boolean pinned, OffsetDateTime startTime, OffsetDateTime endTime,
                       Long ownerDeptId, Long createdBy) {
        dsl.insertInto(BIZ_NOTICE)
            .set(BIZ_NOTICE.ID, id)
            .set(BIZ_NOTICE.TENANT_ID, tenantId)
            .set(BIZ_NOTICE.TITLE, title)
            .set(BIZ_NOTICE.CONTENT, content)
            .set(BIZ_NOTICE.STATUS, status)
            .set(BIZ_NOTICE.PINNED, pinned)
            .set(BIZ_NOTICE.START_TIME, startTime)
            .set(BIZ_NOTICE.END_TIME, endTime)
            .set(BIZ_NOTICE.OWNER_DEPT_ID, ownerDeptId)
            .set(BIZ_NOTICE.VERSION, 0)
            .set(BIZ_NOTICE.CREATED_BY, createdBy)
            .set(BIZ_NOTICE.UPDATED_BY, createdBy)
            .execute();
    }

    /**
     * 乐观锁更新公告。
     * <p>
     * WHERE version = oldVersion，返回受影响行数（0 表示版本冲突）。
     */
    public int update(Long id, String title, String content, Boolean pinned,
                      OffsetDateTime startTime, OffsetDateTime endTime,
                      Integer oldVersion, Long updatedBy) {
        return dsl.update(BIZ_NOTICE)
            .set(BIZ_NOTICE.TITLE, title)
            .set(BIZ_NOTICE.CONTENT, content)
            .set(BIZ_NOTICE.PINNED, pinned)
            .set(BIZ_NOTICE.START_TIME, startTime)
            .set(BIZ_NOTICE.END_TIME, endTime)
            .set(BIZ_NOTICE.VERSION, BIZ_NOTICE.VERSION.plus(1))
            .set(BIZ_NOTICE.UPDATED_BY, updatedBy)
            .set(BIZ_NOTICE.UPDATED_AT, OffsetDateTime.now(clock))
            .where(BIZ_NOTICE.ID.eq(id))
            .and(BIZ_NOTICE.VERSION.eq(oldVersion))
            .execute();
    }

    /**
     * 更新公告状态（含乐观锁版本号递增）。
     *
     * @param id        公告 ID
     * @param newStatus 目标状态码
     * @param updatedBy 操作人 ID
     * @return 受影响行数
     */
    public int updateStatus(Long id, short newStatus, Long updatedBy) {
        return dsl.update(BIZ_NOTICE)
            .set(BIZ_NOTICE.STATUS, newStatus)
            .set(BIZ_NOTICE.VERSION, BIZ_NOTICE.VERSION.plus(1))
            .set(BIZ_NOTICE.UPDATED_BY, updatedBy)
            .set(BIZ_NOTICE.UPDATED_AT, OffsetDateTime.now(clock))
            .where(BIZ_NOTICE.ID.eq(id))
            .execute();
    }

    /**
     * 复制附件关联记录到新公告。
     *
     * @param sourceNoticeId 原公告 ID
     * @param targetNoticeId 新公告 ID
     * @param createdBy      创建人 ID
     */
    public void copyAttachments(Long sourceNoticeId, Long targetNoticeId, Long createdBy) {
        var attachments = dsl.select(
                BIZ_NOTICE_ATTACHMENT.FILE_ID,
                BIZ_NOTICE_ATTACHMENT.SORT_ORDER
            )
            .from(BIZ_NOTICE_ATTACHMENT)
            .where(BIZ_NOTICE_ATTACHMENT.NOTICE_ID.eq(sourceNoticeId))
            .orderBy(BIZ_NOTICE_ATTACHMENT.SORT_ORDER.asc())
            .fetch();

        for (var att : attachments) {
            dsl.insertInto(BIZ_NOTICE_ATTACHMENT)
                .set(BIZ_NOTICE_ATTACHMENT.ID, idGenerator.nextId())
                .set(BIZ_NOTICE_ATTACHMENT.NOTICE_ID, targetNoticeId)
                .set(BIZ_NOTICE_ATTACHMENT.FILE_ID, att.get(BIZ_NOTICE_ATTACHMENT.FILE_ID))
                .set(BIZ_NOTICE_ATTACHMENT.SORT_ORDER, att.get(BIZ_NOTICE_ATTACHMENT.SORT_ORDER))
                .set(BIZ_NOTICE_ATTACHMENT.TENANT_ID, 0L)
                .set(BIZ_NOTICE_ATTACHMENT.CREATED_BY, createdBy)
                .execute();
        }
    }

    /**
     * 复制发送目标记录到新公告。
     *
     * @param sourceNoticeId 原公告 ID
     * @param targetNoticeId 新公告 ID
     */
    public void copyTargets(Long sourceNoticeId, Long targetNoticeId) {
        var targets = dsl.select(
                BIZ_NOTICE_TARGET.TARGET_TYPE,
                BIZ_NOTICE_TARGET.TARGET_ID
            )
            .from(BIZ_NOTICE_TARGET)
            .where(BIZ_NOTICE_TARGET.NOTICE_ID.eq(sourceNoticeId))
            .fetch();

        for (var target : targets) {
            dsl.insertInto(BIZ_NOTICE_TARGET)
                .set(BIZ_NOTICE_TARGET.ID, idGenerator.nextId())
                .set(BIZ_NOTICE_TARGET.NOTICE_ID, targetNoticeId)
                .set(BIZ_NOTICE_TARGET.TARGET_TYPE, target.get(BIZ_NOTICE_TARGET.TARGET_TYPE))
                .set(BIZ_NOTICE_TARGET.TARGET_ID, target.get(BIZ_NOTICE_TARGET.TARGET_ID))
                .execute();
        }
    }

    /**
     * 保存发送目标（用于 publish 时写入目标）。
     *
     * @param noticeId 公告 ID
     * @param targets  发送目标列表
     */
    public void insertTargets(Long noticeId, List<NoticeTarget> targets) {
        for (var target : targets) {
            dsl.insertInto(BIZ_NOTICE_TARGET)
                .set(BIZ_NOTICE_TARGET.ID, idGenerator.nextId())
                .set(BIZ_NOTICE_TARGET.NOTICE_ID, noticeId)
                .set(BIZ_NOTICE_TARGET.TARGET_TYPE, target.targetType())
                .set(BIZ_NOTICE_TARGET.TARGET_ID, target.targetId())
                .execute();
        }
    }

    /**
     * 删除公告的发送目标。
     */
    public void deleteTargets(Long noticeId) {
        dsl.deleteFrom(BIZ_NOTICE_TARGET)
            .where(BIZ_NOTICE_TARGET.NOTICE_ID.eq(noticeId))
            .execute();
    }

    /**
     * 物理删除公告。
     */
    public int deleteById(Long id) {
        return dsl.deleteFrom(BIZ_NOTICE)
            .where(BIZ_NOTICE.ID.eq(id))
            .execute();
    }

    /**
     * 批量删除公告附件关联。
     */
    public void deleteAttachments(Long noticeId) {
        dsl.deleteFrom(BIZ_NOTICE_ATTACHMENT)
            .where(BIZ_NOTICE_ATTACHMENT.NOTICE_ID.eq(noticeId))
            .execute();
    }

    // ------ 私有方法 ------

    /**
     * 根据查询参数构建 jOOQ Condition 列表。
     */
    private List<Condition> buildConditions(NoticeQuery query) {
        List<Condition> conditions = new ArrayList<>();

        if (query.status() != null) {
            conditions.add(BIZ_NOTICE.STATUS.eq(query.status()));
        }
        if (query.keyword() != null && !query.keyword().isBlank()) {
            conditions.add(BIZ_NOTICE.TITLE.containsIgnoreCase(query.keyword()));
        }
        if (query.startTimeFrom() != null) {
            conditions.add(BIZ_NOTICE.START_TIME.greaterOrEqual(query.startTimeFrom()));
        }
        if (query.startTimeTo() != null) {
            conditions.add(BIZ_NOTICE.START_TIME.lessOrEqual(query.startTimeTo()));
        }

        return conditions;
    }
}
