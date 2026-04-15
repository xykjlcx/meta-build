package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.DataScopeType;
import com.metabuild.infra.jooq.datascope.BypassDataScopeAspect;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Set;

import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * DataScope（数据权限）集成测试。
 *
 * <p>验证 DataScopeVisitListener（实现为 ExecuteListener）在 jOOQ SELECT 层正确注入过滤条件：
 * <ul>
 *   <li>SELF：仅查到自己创建的记录（created_by = userId）</li>
 *   <li>OWN_DEPT：仅查到同部门的记录（owner_dept_id = deptId）</li>
 *   <li>ALL（超管）：查到全部记录</li>
 *   <li>@BypassDataScope：绕过过滤，查到全部记录</li>
 * </ul>
 *
 * <p>数据写入通过 JdbcTemplate 直接操作（绕过 jOOQ RecordListener，确保 created_by / owner_dept_id 精确可控）。
 * 数据查询通过 jOOQ DSLContext（SELECT 走 DataScopeVisitListener）。
 *
 * <p>使用 @MockitoBean CurrentUser，通过 Mockito 按测试方法配置不同的数据权限类型。
 * @Transactional 保证测试结束后回滚，不影响其他测试。
 */
class DataScopeIntegrationTest extends BaseIntegrationTest {

    @MockitoBean
    private CurrentUser currentUser;

    @Autowired
    private DSLContext dsl;

    /** 使用 JdbcTemplate 直接写入，绕过 jOOQ AuditFieldsRecordListener，确保 created_by 精确可控 */
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 测试用的部门 ID
    private static final Long DEPT_A = 1001L;
    private static final Long DEPT_B = 1002L;

    // 测试用的用户 ID（不与其他测试冲突）
    private static final Long USER_SELF_ID = 9001L;
    private static final Long USER_OTHER_ID = 9002L;

    @BeforeEach
    void setupTestUsers() {
        // 先创建测试用部门（FK 约束要求 dept_id 必须存在）
        insertTestDeptViaJdbc(DEPT_A, "测试部门A");
        insertTestDeptViaJdbc(DEPT_B, "测试部门B");

        // 通过 JdbcTemplate 直接写入，绕过 jOOQ RecordListener（AuditFieldsRecordListener 会覆盖 created_by）
        // 用户 A：属于 DEPT_A，由 USER_SELF_ID 创建
        insertTestUserViaJdbc(9901L, "ds_user_a", DEPT_A, USER_SELF_ID);
        // 用户 B：属于 DEPT_B，由 USER_OTHER_ID 创建
        insertTestUserViaJdbc(9902L, "ds_user_b", DEPT_B, USER_OTHER_ID);

        // 默认 currentUser mock：已认证、非超管
        when(currentUser.isAuthenticated()).thenReturn(true);
        when(currentUser.isAdmin()).thenReturn(false);
        when(currentUser.userId()).thenReturn(USER_SELF_ID);
        when(currentUser.deptId()).thenReturn(DEPT_A);
        when(currentUser.tenantId()).thenReturn(null);
        when(currentUser.userIdOrSystem()).thenReturn(USER_SELF_ID);
        when(currentUser.dataScopeType()).thenReturn(DataScopeType.SELF);
        when(currentUser.dataScopeDeptIds()).thenReturn(Set.of());
    }

    // ─────────── SELF scope ───────────

    @Test
    void selfScope_should_only_see_records_created_by_self() {
        // currentUser: SELF scope, userId=USER_SELF_ID
        when(currentUser.dataScopeType()).thenReturn(DataScopeType.SELF);

        // 通过 jOOQ DSL 查询（走 DataScopeVisitListener）
        var records = dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.USERNAME.in("ds_user_a", "ds_user_b"))
            .fetch();

        // SELF scope 过滤 created_by = USER_SELF_ID
        // 所以只能看到 ds_user_a（created_by = USER_SELF_ID）
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getUsername()).isEqualTo("ds_user_a");
    }

    // ─────────── OWN_DEPT scope ───────────

    @Test
    void ownDeptScope_should_only_see_records_in_own_dept() {
        // currentUser: OWN_DEPT scope, deptId=DEPT_A
        when(currentUser.dataScopeType()).thenReturn(DataScopeType.OWN_DEPT);
        when(currentUser.deptId()).thenReturn(DEPT_A);

        var records = dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.USERNAME.in("ds_user_a", "ds_user_b"))
            .fetch();

        // OWN_DEPT scope 过滤 owner_dept_id = DEPT_A
        // 只能看到 ds_user_a（owner_dept_id = DEPT_A）
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getUsername()).isEqualTo("ds_user_a");
    }

    // ─────────── ALL scope（超管）───────────

    @Test
    void allScope_admin_should_see_all_records() {
        // currentUser: 超管，数据权限 ALL
        when(currentUser.isAdmin()).thenReturn(true);
        when(currentUser.dataScopeType()).thenReturn(DataScopeType.ALL);

        var records = dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.USERNAME.in("ds_user_a", "ds_user_b"))
            .fetch();

        // ALL scope 不过滤，两条记录都可见
        assertThat(records).hasSize(2);
    }

    // ─────────── @BypassDataScope ───────────

    @Test
    void bypassDataScope_should_ignore_filtering() {
        // currentUser: SELF scope，但查询会被 @BypassDataScope 绕过
        when(currentUser.dataScopeType()).thenReturn(DataScopeType.SELF);

        // 手动设置 BypassDataScope ThreadLocal（模拟 @BypassDataScope 切面效果）
        // 在测试中直接操作 ThreadLocal，避免依赖 AOP 代理
        try {
            // 通过反射或直接 API 设置绕过标志
            setBypassFlag(true);

            var records = dsl.selectFrom(MB_IAM_USER)
                .where(MB_IAM_USER.USERNAME.in("ds_user_a", "ds_user_b"))
                .fetch();

            // 绕过后不过滤，两条记录都可见
            assertThat(records).hasSize(2);
        } finally {
            setBypassFlag(false);
        }
    }

    // ─────────── 辅助方法 ───────────

    /**
     * 通过 JdbcTemplate 直接 INSERT 部门，满足 FK 约束。
     */
    private void insertTestDeptViaJdbc(Long id, String name) {
        jdbcTemplate.update("""
            INSERT INTO mb_iam_dept
              (id, tenant_id, parent_id, name, sort_order, status, owner_dept_id,
               created_by, created_at, updated_by, updated_at, version)
            VALUES
              (?, 0, NULL, ?, 0, 1, 0,
               0, NOW(), 0, NOW(), 0)
            ON CONFLICT (id) DO NOTHING
            """,
            id, name
        );
    }

    /**
     * 通过 JdbcTemplate 直接 INSERT，绕过 jOOQ AuditFieldsRecordListener。
     * AuditFieldsRecordListener 会在 jOOQ INSERT 时自动覆盖 created_by，导致测试数据的 created_by 无法精确控制。
     * 使用 JdbcTemplate 直接执行 SQL，确保 created_by 和 owner_dept_id 的值完全可控。
     */
    private void insertTestUserViaJdbc(Long id, String username, Long deptId, Long createdBy) {
        jdbcTemplate.update("""
            INSERT INTO mb_iam_user
              (id, tenant_id, username, password_hash, dept_id, status, owner_dept_id,
               created_by, created_at, updated_by, updated_at, version, password_updated_at, must_change_password)
            VALUES
              (?, 0, ?, '$2a$12$placeholder', ?, 1, ?,
               ?, NOW(), ?, NOW(), 0, NOW(), false)
            """,
            id, username, deptId, deptId,
            createdBy, createdBy
        );
    }

    /**
     * 通过反射设置 BypassDataScopeAspect 的 ThreadLocal 标志。
     * 在测试中模拟 @BypassDataScope 的切面效果，无需 AOP 代理。
     */
    private void setBypassFlag(boolean bypass) {
        try {
            var field = BypassDataScopeAspect.class.getDeclaredField("BYPASS");
            field.setAccessible(true);
            @SuppressWarnings("unchecked")
            ThreadLocal<Boolean> threadLocal = (ThreadLocal<Boolean>) field.get(null);
            if (bypass) {
                threadLocal.set(true);
            } else {
                threadLocal.remove();
            }
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException("无法访问 BypassDataScopeAspect.BYPASS ThreadLocal", e);
        }
    }
}
