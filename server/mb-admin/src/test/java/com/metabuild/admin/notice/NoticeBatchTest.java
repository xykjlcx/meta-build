package com.metabuild.admin.notice;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.business.notice.api.NoticeErrorCodes;
import com.metabuild.business.notice.api.NoticeTarget;
import com.metabuild.business.notice.api.cmd.BatchIdsCmd;
import com.metabuild.business.notice.api.cmd.NoticeCreateCmd;
import com.metabuild.business.notice.api.cmd.NoticePublishCmd;
import com.metabuild.business.notice.api.vo.BatchResultVo;
import com.metabuild.business.notice.domain.notice.NoticeService;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.DataScopeType;
import com.metabuild.platform.notification.domain.notification.NotificationService;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static com.metabuild.schema.tables.BizNoticeRecipient.BIZ_NOTICE_RECIPIENT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * 批量操作（batchPublish / batchDelete）行为测试：
 * 每条独立事务、部分成功、失败明细回传。
 *
 * <p>因 {@code publishOne / deleteOne} 使用 {@code @Transactional(REQUIRES_NEW)}
 * 独立事务提交，与 {@link BaseIntegrationTest} 的默认 {@code @Transactional} 自动回滚
 * 冲突；类上覆盖 {@code NOT_SUPPORTED} 禁用测试事务，手动 truncate 清理数据。
 */
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class NoticeBatchTest extends BaseIntegrationTest {

    @MockitoBean
    private CurrentUser currentUser;

    /** 屏蔽异步通知推送，避免 @Async + REQUIRES_NEW 导致 flaky */
    @MockitoBean
    private NotificationService notificationService;

    @Autowired
    private NoticeService noticeService;

    @Autowired
    private DSLContext dsl;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Long ADMIN_USER_ID = 90001L;
    private static final Long TARGET_USER_ID = 90002L;
    private static final Long DEPT_ID = 9001L;

    @BeforeEach
    void setUp() {
        // 清理本测试相关表，避免 REQUIRES_NEW 提交的数据跨测试污染
        jdbcTemplate.update("DELETE FROM biz_notice_recipient");
        jdbcTemplate.update("DELETE FROM biz_notice_target");
        jdbcTemplate.update("DELETE FROM biz_notice_attachment");
        jdbcTemplate.update("DELETE FROM biz_notice");

        mockAsAdmin();
        insertTestDept(DEPT_ID, "批量测试部门");
        insertTestUser(ADMIN_USER_ID, "batch_admin", DEPT_ID);
        insertTestUser(TARGET_USER_ID, "batch_target", DEPT_ID);
    }

    @Test
    void batchPublish_部分成功_返回失败明细() {
        // 1 条 DRAFT（可发布）
        Long draftId = noticeService.create(new NoticeCreateCmd(
            "可发布草稿", null, false, null, null, null
        )).id();
        // 1 条已 PUBLISHED（会失败：状态非 DRAFT）
        Long publishedId = noticeService.create(new NoticeCreateCmd(
            "已发布", null, false, null, null, null
        )).id();
        noticeService.publish(publishedId, new NoticePublishCmd(
            List.of(new NoticeTarget("USER", TARGET_USER_ID))
        ));
        // 1 条不存在 ID（会失败：NotFound）
        Long nonExistentId = 999_888_777L;

        BatchResultVo result = noticeService.batchPublish(
            new BatchIdsCmd(List.of(draftId, publishedId, nonExistentId))
        );

        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.failedCount()).isEqualTo(2);
        assertThat(result.failures()).hasSize(2);
        // 已发布那条 errorCode 为 onlyDraftCanPublish
        assertThat(result.failures())
            .extracting(BatchResultVo.FailedItem::id, BatchResultVo.FailedItem::errorCode)
            .contains(
                org.assertj.core.groups.Tuple.tuple(publishedId, NoticeErrorCodes.ONLY_DRAFT_CAN_PUBLISH),
                org.assertj.core.groups.Tuple.tuple(nonExistentId, NoticeErrorCodes.NOT_FOUND)
            );
    }

    @Test
    void batchPublish_成功条目_recipients已展开() {
        // 创建 2 条草稿，并预先写入 targets（模拟编辑阶段保存的目标）
        Long id1 = noticeService.create(new NoticeCreateCmd(
            "批量草稿1", null, false, null, null, null
        )).id();
        Long id2 = noticeService.create(new NoticeCreateCmd(
            "批量草稿2", null, false, null, null, null
        )).id();
        // 直接写 biz_notice_target
        insertTarget(id1, "USER", TARGET_USER_ID);
        insertTarget(id2, "USER", ADMIN_USER_ID);

        BatchResultVo result = noticeService.batchPublish(
            new BatchIdsCmd(List.of(id1, id2))
        );

        assertThat(result.successCount()).isEqualTo(2);
        assertThat(result.failedCount()).isZero();

        // 两条的 recipients 都应被展开写入
        int r1 = dsl.selectCount().from(BIZ_NOTICE_RECIPIENT)
            .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(id1))
            .fetchOne(0, int.class);
        int r2 = dsl.selectCount().from(BIZ_NOTICE_RECIPIENT)
            .where(BIZ_NOTICE_RECIPIENT.NOTICE_ID.eq(id2))
            .fetchOne(0, int.class);
        assertThat(r1).isEqualTo(1);
        assertThat(r2).isEqualTo(1);
    }

    @Test
    void batchDelete_非法状态_进入failures() {
        Long draftId = noticeService.create(new NoticeCreateCmd(
            "可删草稿", null, false, null, null, null
        )).id();
        Long publishedId = noticeService.create(new NoticeCreateCmd(
            "已发布不可删", null, false, null, null, null
        )).id();
        noticeService.publish(publishedId, new NoticePublishCmd(
            List.of(new NoticeTarget("USER", TARGET_USER_ID))
        ));

        BatchResultVo result = noticeService.batchDelete(
            new BatchIdsCmd(List.of(draftId, publishedId))
        );

        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.failedCount()).isEqualTo(1);
        assertThat(result.failures()).hasSize(1);
        assertThat(result.failures().get(0).id()).isEqualTo(publishedId);
        assertThat(result.failures().get(0).errorCode())
            .isEqualTo(NoticeErrorCodes.ONLY_DRAFT_OR_REVOKED_CAN_DELETE);
    }

    @Test
    void batchDelete_不存在id_进入failures() {
        Long draftId = noticeService.create(new NoticeCreateCmd(
            "草稿", null, false, null, null, null
        )).id();
        Long nonExistentId = 777_666_555L;

        BatchResultVo result = noticeService.batchDelete(
            new BatchIdsCmd(List.of(draftId, nonExistentId))
        );

        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.failedCount()).isEqualTo(1);
        assertThat(result.failures().get(0).id()).isEqualTo(nonExistentId);
        assertThat(result.failures().get(0).errorCode()).isEqualTo(NoticeErrorCodes.NOT_FOUND);
    }

    // ------ 辅助方法 ------

    private void mockAsAdmin() {
        when(currentUser.isAuthenticated()).thenReturn(true);
        when(currentUser.isAdmin()).thenReturn(true);
        when(currentUser.userId()).thenReturn(ADMIN_USER_ID);
        when(currentUser.username()).thenReturn("batch_admin");
        when(currentUser.deptId()).thenReturn(DEPT_ID);
        when(currentUser.tenantId()).thenReturn(null);
        when(currentUser.userIdOrSystem()).thenReturn(ADMIN_USER_ID);
        when(currentUser.permissions()).thenReturn(Set.of());
        when(currentUser.roles()).thenReturn(Set.of("admin"));
        when(currentUser.hasPermission(org.mockito.ArgumentMatchers.anyString())).thenReturn(true);
        when(currentUser.dataScopeType()).thenReturn(DataScopeType.ALL);
        when(currentUser.dataScopeDeptIds()).thenReturn(Set.of());
    }

    private void insertTestDept(Long id, String name) {
        jdbcTemplate.update("""
            INSERT INTO mb_iam_dept
              (id, tenant_id, parent_id, name, sort_order, status, owner_dept_id,
               created_by, created_at, updated_by, updated_at, version)
            VALUES
              (?, 0, NULL, ?, 0, 1, 0, 0, NOW(), 0, NOW(), 0)
            ON CONFLICT (id) DO NOTHING
            """,
            id, name
        );
    }

    private void insertTestUser(Long id, String username, Long deptId) {
        jdbcTemplate.update("""
            INSERT INTO mb_iam_user
              (id, tenant_id, username, password_hash, dept_id, status, owner_dept_id,
               created_by, created_at, updated_by, updated_at, version,
               password_updated_at, must_change_password)
            VALUES
              (?, 0, ?, '$2a$12$placeholder', ?, 1, ?,
               ?, NOW(), ?, NOW(), 0, NOW(), false)
            ON CONFLICT (id) DO NOTHING
            """,
            id, username, deptId, deptId, id, id
        );
    }

    private void insertTarget(Long noticeId, String type, Long targetId) {
        jdbcTemplate.update(
            "INSERT INTO biz_notice_target (id, notice_id, target_type, target_id) VALUES (?, ?, ?, ?)",
            System.nanoTime(), noticeId, type, targetId
        );
    }
}
