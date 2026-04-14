package com.metabuild.business.notice.domain;

import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.BypassDataScope;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.InsertValuesStep4;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import static com.metabuild.schema.tables.BizNoticeRecipient.BIZ_NOTICE_RECIPIENT;
import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;
import static com.metabuild.schema.tables.MbIamUserRole.MB_IAM_USER_ROLE;

/**
 * 公告接收人数据访问层。
 * <p>
 * 接收人记录在发布时由 target 展开到具体用户后写入，每批 500 条分批插入。
 */
@Repository
@RequiredArgsConstructor
public class NoticeRecipientRepository {

    private static final int BATCH_SIZE = 500;

    private final DSLContext dsl;
    private final SnowflakeIdGenerator idGenerator;
    private final Clock clock;

    /**
     * 分批批量插入接收人记录（每批 500 条）。
     *
     * @param noticeId 公告 ID
     * @param userIds  用户 ID 列表
     */
    @BypassDataScope
    public void batchInsert(Long noticeId, List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now(clock);

        for (int i = 0; i < userIds.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, userIds.size());
            List<Long> batch = userIds.subList(i, end);

            InsertValuesStep4<?, Long, Long, Long, OffsetDateTime> insert = dsl
                .insertInto(BIZ_NOTICE_RECIPIENT,
                    BIZ_NOTICE_RECIPIENT.ID,
                    BIZ_NOTICE_RECIPIENT.NOTICE_ID,
                    BIZ_NOTICE_RECIPIENT.USER_ID,
                    BIZ_NOTICE_RECIPIENT.CREATED_AT);

            for (Long userId : batch) {
                insert = insert.values(idGenerator.nextId(), noticeId, userId, now);
            }

            insert.execute();
        }
    }

    /**
     * 删除公告的全部接收人记录。
     *
     * @param noticeId 公告 ID
     */
    public void deleteByNoticeId(Long noticeId) {
        dsl.deleteFrom(BIZ_NOTICE_RECIPIENT)
            .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(noticeId))
            .execute();
    }

    /**
     * 统计接收人总数。
     *
     * @param noticeId 公告 ID
     * @return 接收人总数
     */
    public int countByNoticeId(Long noticeId) {
        return dsl.selectCount()
            .from(BIZ_NOTICE_RECIPIENT)
            .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(noticeId))
            .fetchOne(0, int.class);
    }

    /**
     * 统计已读接收人数（read_at IS NOT NULL）。
     *
     * @param noticeId 公告 ID
     * @return 已读人数
     */
    public int countReadByNoticeId(Long noticeId) {
        return dsl.selectCount()
            .from(BIZ_NOTICE_RECIPIENT)
            .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(noticeId))
            .and(BIZ_NOTICE_RECIPIENT.READ_AT.isNotNull())
            .fetchOne(0, int.class);
    }

    // ------ 接收人展开查询（从 IAM 表获取用户 ID 列表） ------

    /**
     * 查询全部启用状态的用户 ID（用于 ALL 类型目标展开）。
     */
    @BypassDataScope
    public List<Long> findAllActiveUserIds() {
        return dsl.select(MB_IAM_USER.ID)
            .from(MB_IAM_USER)
            .where(MB_IAM_USER.STATUS.eq((short) 1))
            .fetch(MB_IAM_USER.ID);
    }

    /**
     * 查询指定部门下全部启用用户的 ID（用于 DEPT 类型目标展开）。
     *
     * @param deptId 部门 ID
     */
    @BypassDataScope
    public List<Long> findUserIdsByDeptId(Long deptId) {
        return dsl.select(MB_IAM_USER.ID)
            .from(MB_IAM_USER)
            .where(MB_IAM_USER.DEPT_ID.eq(deptId))
            .and(MB_IAM_USER.STATUS.eq((short) 1))
            .fetch(MB_IAM_USER.ID);
    }

    /**
     * 查询拥有指定角色的全部启用用户的 ID（用于 ROLE 类型目标展开）。
     *
     * @param roleId 角色 ID
     */
    @BypassDataScope
    public List<Long> findUserIdsByRoleId(Long roleId) {
        return dsl.select(MB_IAM_USER.ID)
            .from(MB_IAM_USER)
            .join(MB_IAM_USER_ROLE).on(MB_IAM_USER.ID.eq(MB_IAM_USER_ROLE.USER_ID))
            .where(MB_IAM_USER_ROLE.ROLE_ID.eq(roleId))
            .and(MB_IAM_USER.STATUS.eq((short) 1))
            .fetch(MB_IAM_USER.ID);
    }
}
