package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.platform.iam.domain.permission.PermissionCache;
import com.metabuild.platform.iam.domain.permission.PermissionService;
import com.metabuild.platform.iam.domain.permission.PermissionWriteFacade;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.Commit;
import org.springframework.test.context.transaction.TestTransaction;

import java.time.Duration;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PermissionService Redis 缓存 + 事件驱动失效集成测试。
 * <ul>
 *   <li>缓存命中：第一次查 DB 写缓存，第二次直接命中缓存</li>
 *   <li>写权限触发失效：通过 Facade 写后异步监听器 evict 缓存</li>
 * </ul>
 * 失效场景必须 @Commit，否则事务回滚不会触发 afterCommit 回调。
 */
@Import(TestSecurityConfig.class)
class PermissionCacheTest extends BaseIntegrationTest {

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private PermissionCache permissionCache;

    @Autowired
    private PermissionWriteFacade permissionWriteFacade;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Long TEST_USER_ID = 99001L;
    private static final Long TEST_ROLE_ID = 99101L;
    private static final Long TEST_MENU_ID = 99201L;
    private static final String TEST_PERM_CODE = "test:perm:cache";

    @BeforeEach
    void cleanCache() {
        permissionCache.evict(TEST_USER_ID);
    }

    @Test
    void firstQueryHitsDb_secondQueryHitsCache() {
        seedUserRolePermission();

        Set<String> first = permissionService.getPermissions(TEST_USER_ID);
        assertThat(first).contains(TEST_PERM_CODE);

        // 缓存应该已写入
        assertThat(permissionCache.get(TEST_USER_ID)).isPresent().get()
            .isEqualTo(first);

        // 删 DB 关联，再查一次应当仍然命中缓存（证明走了缓存而非 DB）
        jdbcTemplate.update("DELETE FROM mb_iam_user_role WHERE user_id = ?", TEST_USER_ID);
        Set<String> second = permissionService.getPermissions(TEST_USER_ID);
        assertThat(second).contains(TEST_PERM_CODE);
    }

    @Test
    @Commit
    void facadeWrite_should_evict_cache_async() {
        // Step 1: seed 并提交——让 Facade 后续 @Transactional 不要参与外层测试事务，
        // 否则 afterCommit 钩子要等到测试方法结束才触发，Awaitility 等不到。
        seedUserRolePermission();
        TestTransaction.flagForCommit();
        TestTransaction.end();

        // Step 2: 预热缓存
        permissionService.getPermissions(TEST_USER_ID);
        assertThat(permissionCache.get(TEST_USER_ID)).isPresent();

        // Step 3: 在新事务外调 Facade——Facade 自己 @Transactional 会开新事务，
        // afterCommit 立即触发事件，异步监听器失效缓存。
        permissionWriteFacade.assignRolesToUser(TEST_USER_ID, List.of());

        // Step 4: 异步监听器应当 evict 缓存（最长等 3 秒）
        Awaitility.await().atMost(Duration.ofSeconds(3))
            .untilAsserted(() -> assertThat(permissionCache.get(TEST_USER_ID)).isEmpty());

        // Step 5: 清理 seed 数据（用独立事务）
        TestTransaction.start();
        cleanupSeed();
        TestTransaction.flagForCommit();
        TestTransaction.end();
    }

    private void seedUserRolePermission() {
        // parent_id 用 NULL：V20260605_001 迁移后 parent_id 走自引用 FK，0 不再是占位值
        jdbcTemplate.update(
            "INSERT INTO mb_iam_menu (id, parent_id, name, permission_code, menu_type, sort_order, visible, version, created_by, updated_by) " +
                "VALUES (?, NULL, ?, ?, 'BUTTON', 0, true, 0, 0, 0) ON CONFLICT (id) DO NOTHING",
            TEST_MENU_ID, "测试缓存权限", TEST_PERM_CODE);
        jdbcTemplate.update(
            "INSERT INTO mb_iam_role (id, name, code, data_scope, status, sort_order, owner_dept_id, version, created_by, updated_by) " +
                "VALUES (?, ?, ?, 'SELF', 1, 0, 0, 0, 0, 0) ON CONFLICT (id) DO NOTHING",
            TEST_ROLE_ID, "缓存测试角色", "cache_test_role");
        // dept_id 用 NULL：V20260605_001 迁移后 dept_id 走 FK，0 不再是占位值
        jdbcTemplate.update(
            "INSERT INTO mb_iam_user (id, username, password_hash, dept_id, owner_dept_id, status, must_change_password, version, created_by, updated_by) " +
                "VALUES (?, ?, '$2a$10$abcdefghijklmnopqrstuv', NULL, 0, 1, false, 0, 0, 0) ON CONFLICT (id) DO NOTHING",
            TEST_USER_ID, "perm_cache_user");
        jdbcTemplate.update(
            "INSERT INTO mb_iam_role_menu (role_id, menu_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            TEST_ROLE_ID, TEST_MENU_ID);
        jdbcTemplate.update(
            "INSERT INTO mb_iam_user_role (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            TEST_USER_ID, TEST_ROLE_ID);
    }

    private void cleanupSeed() {
        jdbcTemplate.update("DELETE FROM mb_iam_user_role WHERE user_id = ?", TEST_USER_ID);
        jdbcTemplate.update("DELETE FROM mb_iam_role_menu WHERE role_id = ?", TEST_ROLE_ID);
        jdbcTemplate.update("DELETE FROM mb_iam_user WHERE id = ?", TEST_USER_ID);
        jdbcTemplate.update("DELETE FROM mb_iam_role WHERE id = ?", TEST_ROLE_ID);
        jdbcTemplate.update("DELETE FROM mb_iam_menu WHERE id = ?", TEST_MENU_ID);
        permissionCache.evict(TEST_USER_ID);
    }
}
