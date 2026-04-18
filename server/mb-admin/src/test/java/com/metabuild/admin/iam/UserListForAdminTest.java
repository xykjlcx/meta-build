package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.platform.iam.api.cmd.DeptCreateCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.api.query.UserListQuery;
import com.metabuild.platform.iam.api.cmd.UserUpdateCmd;
import com.metabuild.platform.iam.api.vo.UserListVo;
import com.metabuild.platform.iam.domain.dept.DeptService;
import com.metabuild.platform.iam.domain.user.UserService;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.schema.tables.records.MbIamLoginLogRecord;
import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.time.OffsetDateTime;
import java.util.List;

import static com.metabuild.schema.tables.MbIamLoginLog.MB_IAM_LOGIN_LOG;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * UserService.listForAdmin 集成测试（扩 query + lastLoginAt 聚合）。
 */
@Import(TestSecurityConfig.class)
class UserListForAdminTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private DeptService deptService;

    @Autowired
    private DSLContext dsl;

    @Autowired
    private SnowflakeIdGenerator idGenerator;

    // ───────── 基础分页 + keyword ─────────

    @Test
    void list_by_keyword_should_match_username_nickname_email() {
        userService.createUser(new UserCreateCmd("johnsmith", "Test@12345", "john@example.com", null, "John", null));
        userService.createUser(new UserCreateCmd("jackson", "Test@12345", "jack@example.com", null, "Jackson", null));
        userService.createUser(new UserCreateCmd("unrelated", "Test@12345", "xyz@example.com", null, "无关", null));

        PageResult<UserListVo> result = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 20, null), null, false, null, "john"
        ));

        assertThat(result.content()).extracting(UserListVo::username)
            .contains("johnsmith");
    }

    @Test
    void list_by_status_should_filter_enabled_only() {
        Long enabledId = userService.createUser(new UserCreateCmd("enableduser", "Test@12345", "en@example.com", null, null, null));
        Long disabledId = userService.createUser(new UserCreateCmd("disableduser", "Test@12345", "dis@example.com", null, null, null));
        userService.updateUser(disabledId, new UserUpdateCmd(null, null, null, null, null, (short) 0));

        PageResult<UserListVo> enabled = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), null, false, (short) 1, null
        ));
        assertThat(enabled.content()).extracting(UserListVo::id).contains(enabledId).doesNotContain(disabledId);

        PageResult<UserListVo> disabled = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), null, false, (short) 0, null
        ));
        assertThat(disabled.content()).extracting(UserListVo::id).contains(disabledId).doesNotContain(enabledId);
    }

    // ───────── deptId + includeDescendants ─────────

    @Test
    void list_by_deptId_direct_should_only_return_direct_members() {
        Long root = deptService.createDept(new DeptCreateCmd(null, "集团", null, 1));
        Long mid = deptService.createDept(new DeptCreateCmd(root, "研发中心", null, 1));
        Long leaf = deptService.createDept(new DeptCreateCmd(mid, "前端组", null, 1));

        Long u1 = userService.createUser(new UserCreateCmd("u_root_direct", "Test@12345", "u1@example.com", null, null, root));
        Long u2 = userService.createUser(new UserCreateCmd("u_mid_direct", "Test@12345", "u2@example.com", null, null, mid));
        Long u3 = userService.createUser(new UserCreateCmd("u_leaf_direct", "Test@12345", "u3@example.com", null, null, leaf));

        // 不含后代：仅查根部门
        PageResult<UserListVo> direct = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), root, false, null, null
        ));
        assertThat(direct.content()).extracting(UserListVo::id)
            .contains(u1)
            .doesNotContain(u2, u3);
    }

    @Test
    void list_by_deptId_with_descendants_should_include_all_subtree() {
        Long root = deptService.createDept(new DeptCreateCmd(null, "集团2", null, 1));
        Long mid = deptService.createDept(new DeptCreateCmd(root, "研发中心2", null, 1));
        Long leaf = deptService.createDept(new DeptCreateCmd(mid, "前端组2", null, 1));

        Long u1 = userService.createUser(new UserCreateCmd("u_root_desc", "Test@12345", "d1@example.com", null, null, root));
        Long u2 = userService.createUser(new UserCreateCmd("u_mid_desc", "Test@12345", "d2@example.com", null, null, mid));
        Long u3 = userService.createUser(new UserCreateCmd("u_leaf_desc", "Test@12345", "d3@example.com", null, null, leaf));

        PageResult<UserListVo> withDescendants = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), root, true, null, null
        ));
        assertThat(withDescendants.content()).extracting(UserListVo::id)
            .contains(u1, u2, u3);
    }

    // ───────── lastLoginAt 聚合 ─────────

    @Test
    void list_should_return_null_last_login_when_user_never_logged_in() {
        Long id = userService.createUser(new UserCreateCmd("neverloggedin", "Test@12345", "never@example.com", null, null, null));

        PageResult<UserListVo> result = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), null, false, null, "neverloggedin"
        ));
        UserListVo vo = result.content().stream().filter(v -> v.id().equals(id)).findFirst().orElseThrow();
        assertThat(vo.lastLoginAt()).isNull();
    }

    @Test
    void list_should_aggregate_max_success_created_at_as_last_login() {
        Long id = userService.createUser(new UserCreateCmd("loggedinuser", "Test@12345", "loggedin@example.com", null, null, null));

        // 插入 3 条登录日志：1 成功 + 1 失败 + 1 成功（最新）
        OffsetDateTime t1 = OffsetDateTime.parse("2026-01-01T10:00:00+08:00");
        OffsetDateTime t2 = OffsetDateTime.parse("2026-02-01T10:00:00+08:00");
        OffsetDateTime t3 = OffsetDateTime.parse("2026-03-01T10:00:00+08:00");
        insertLoginLog(id, true, t1);
        insertLoginLog(id, false, t3); // 失败更晚，不应被聚合
        insertLoginLog(id, true, t2);

        PageResult<UserListVo> result = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), null, false, null, "loggedinuser"
        ));
        UserListVo vo = result.content().stream().filter(v -> v.id().equals(id)).findFirst().orElseThrow();
        assertThat(vo.lastLoginAt()).isEqualTo(t2);
    }

    @Test
    void list_should_return_null_when_only_failed_logins() {
        Long id = userService.createUser(new UserCreateCmd("onlyfaileduser", "Test@12345", "onlyfailed@example.com", null, null, null));
        insertLoginLog(id, false, OffsetDateTime.now());

        PageResult<UserListVo> result = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, null), null, false, null, "onlyfaileduser"
        ));
        UserListVo vo = result.content().stream().filter(v -> v.id().equals(id)).findFirst().orElseThrow();
        assertThat(vo.lastLoginAt()).isNull();
    }

    // ───────── sort 白名单 ─────────

    @Test
    void list_should_support_sort_by_username_asc() {
        userService.createUser(new UserCreateCmd("zzzz_sort", "Test@12345", "z@example.com", null, null, null));
        userService.createUser(new UserCreateCmd("aaaa_sort", "Test@12345", "a@example.com", null, null, null));
        userService.createUser(new UserCreateCmd("mmmm_sort", "Test@12345", "m@example.com", null, null, null));

        PageResult<UserListVo> result = userService.listForAdmin(new UserListQuery(
            PageQuery.normalized(1, 50, List.of("username,asc")), null, false, null, "_sort"
        ));

        List<String> usernames = result.content().stream().map(UserListVo::username).toList();
        assertThat(usernames).containsSubsequence("aaaa_sort", "mmmm_sort", "zzzz_sort");
    }

    private void insertLoginLog(Long userId, boolean success, OffsetDateTime at) {
        MbIamLoginLogRecord record = dsl.newRecord(MB_IAM_LOGIN_LOG);
        record.setId(idGenerator.nextId());
        record.setUserId(userId);
        record.setUsername("test-user-" + userId);
        record.setSuccess(success);
        record.setCreatedAt(at);
        dsl.insertInto(MB_IAM_LOGIN_LOG).set(record).execute();
    }
}
