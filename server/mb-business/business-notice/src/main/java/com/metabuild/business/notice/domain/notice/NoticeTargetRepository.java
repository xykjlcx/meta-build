package com.metabuild.business.notice.domain.notice;

import com.metabuild.business.notice.api.NoticeTarget;
import com.metabuild.business.notice.api.vo.NoticeTargetVo;
import com.metabuild.common.id.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.BizNoticeTarget.BIZ_NOTICE_TARGET;
import static com.metabuild.schema.tables.MbIamDept.MB_IAM_DEPT;
import static com.metabuild.schema.tables.MbIamRole.MB_IAM_ROLE;
import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 公告发送目标数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class NoticeTargetRepository {

    private final DSLContext dsl;
    private final SnowflakeIdGenerator idGenerator;

    /**
     * 批量插入发送目标。
     *
     * @param noticeId 公告 ID
     * @param targets  发送目标列表
     */
    public void batchInsert(Long noticeId, List<NoticeTarget> targets) {
        if (targets == null || targets.isEmpty()) {
            return;
        }
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
     * 删除公告的全部发送目标。
     *
     * @param noticeId 公告 ID
     */
    public void deleteByNoticeId(Long noticeId) {
        dsl.deleteFrom(BIZ_NOTICE_TARGET)
            .where(BIZ_NOTICE_TARGET.NOTICE_ID.eq(noticeId))
            .execute();
    }

    /**
     * 查询公告发送目标列表（含目标名称）。
     * <p>
     * 根据 targetType 动态 JOIN 对应表获取名称：
     * DEPT → mb_iam_dept.name, ROLE → mb_iam_role.name, USER → mb_iam_user.nickname,
     * ALL → 固定返回"全员"。
     *
     * @param noticeId 公告 ID
     * @return 发送目标视图列表
     */
    public List<NoticeTargetVo> findByNoticeId(Long noticeId) {
        // 使用 CASE 表达式 + LEFT JOIN 多表获取目标名称
        var targetNameField = DSL.case_(BIZ_NOTICE_TARGET.TARGET_TYPE)
            .when("ALL", DSL.val("全员"))
            .when("DEPT", MB_IAM_DEPT.NAME)
            .when("ROLE", MB_IAM_ROLE.NAME)
            .when("USER", MB_IAM_USER.NICKNAME)
            .else_(DSL.val("未知"))
            .as("target_name");

        return dsl.select(
                BIZ_NOTICE_TARGET.TARGET_TYPE,
                BIZ_NOTICE_TARGET.TARGET_ID,
                targetNameField
            )
            .from(BIZ_NOTICE_TARGET)
            .leftJoin(MB_IAM_DEPT)
                .on(BIZ_NOTICE_TARGET.TARGET_TYPE.eq("DEPT")
                    .and(BIZ_NOTICE_TARGET.TARGET_ID.eq(MB_IAM_DEPT.ID)))
            .leftJoin(MB_IAM_ROLE)
                .on(BIZ_NOTICE_TARGET.TARGET_TYPE.eq("ROLE")
                    .and(BIZ_NOTICE_TARGET.TARGET_ID.eq(MB_IAM_ROLE.ID)))
            .leftJoin(MB_IAM_USER)
                .on(BIZ_NOTICE_TARGET.TARGET_TYPE.eq("USER")
                    .and(BIZ_NOTICE_TARGET.TARGET_ID.eq(MB_IAM_USER.ID)))
            .where(BIZ_NOTICE_TARGET.NOTICE_ID.eq(noticeId))
            .fetch()
            .map(r -> new NoticeTargetVo(
                r.get(BIZ_NOTICE_TARGET.TARGET_TYPE),
                r.get(BIZ_NOTICE_TARGET.TARGET_ID),
                r.get("target_name", String.class)
            ));
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
}
