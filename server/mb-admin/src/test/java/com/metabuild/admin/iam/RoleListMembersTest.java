package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.iam.api.cmd.AssignRolesCmd;
import com.metabuild.platform.iam.api.cmd.RoleCreateCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.api.cmd.UserUpdateCmd;
import com.metabuild.platform.iam.api.vo.UserVo;
import com.metabuild.platform.iam.domain.role.RoleService;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A6 GET /roles/:id/members 集成测试。
 */
@Import(TestSecurityConfig.class)
class RoleListMembersTest extends BaseIntegrationTest {

    @Autowired
    private RoleService roleService;

    @Autowired
    private UserService userService;

    @Test
    void listMembers_should_return_empty_when_no_members() {
        Long roleId = roleService.createRole(new RoleCreateCmd("空成员角色", "empty_members_role", "SELF", null, 1));

        PageResult<UserVo> result = roleService.listMembers(roleId, PageQuery.normalized(1, 20, null), null);
        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
    }

    @Test
    void listMembers_should_return_assigned_users() {
        Long roleId = roleService.createRole(new RoleCreateCmd("有成员角色", "members_role_1", "SELF", null, 1));
        Long u1 = userService.createUser(new UserCreateCmd("memberuser1", "Test@12345", "m1@example.com", null, null, null));
        Long u2 = userService.createUser(new UserCreateCmd("memberuser2", "Test@12345", "m2@example.com", null, null, null));

        roleService.assignRolesToUser(u1, new AssignRolesCmd(List.of(roleId)));
        roleService.assignRolesToUser(u2, new AssignRolesCmd(List.of(roleId)));

        PageResult<UserVo> result = roleService.listMembers(roleId, PageQuery.normalized(1, 20, null), null);
        assertThat(result.content()).extracting(UserVo::id).containsExactlyInAnyOrder(u1, u2);
        assertThat(result.totalElements()).isEqualTo(2);
    }

    @Test
    void listMembers_should_include_disabled_users() {
        Long roleId = roleService.createRole(new RoleCreateCmd("含禁用角色", "members_role_2", "SELF", null, 1));
        Long disabledUser = userService.createUser(new UserCreateCmd("disabledmember", "Test@12345", "dm@example.com", null, null, null));

        roleService.assignRolesToUser(disabledUser, new AssignRolesCmd(List.of(roleId)));
        userService.updateUser(disabledUser, new UserUpdateCmd(null, null, null, null, null, (short) 0));

        PageResult<UserVo> result = roleService.listMembers(roleId, PageQuery.normalized(1, 20, null), null);
        UserVo vo = result.content().stream().filter(u -> u.id().equals(disabledUser)).findFirst().orElseThrow();
        assertThat(vo.status()).isEqualTo((short) 0);
    }

    @Test
    void listMembers_should_match_keyword_across_username_nickname_email() {
        Long roleId = roleService.createRole(new RoleCreateCmd("关键词测试角色", "kw_members_role", "SELF", null, 1));
        Long u1 = userService.createUser(new UserCreateCmd("alpha_user", "Test@12345", "alpha@example.com", null, null, null));
        Long u2 = userService.createUser(new UserCreateCmd("beta_user", "Test@12345", "beta@example.com", null, null, null));

        roleService.assignRolesToUser(u1, new AssignRolesCmd(List.of(roleId)));
        roleService.assignRolesToUser(u2, new AssignRolesCmd(List.of(roleId)));

        PageResult<UserVo> result = roleService.listMembers(roleId, PageQuery.normalized(1, 20, null), "alpha");
        assertThat(result.content()).extracting(UserVo::id).containsExactly(u1);
    }

    @Test
    void listMembers_should_throw_not_found_when_role_missing() {
        assertThatThrownBy(() -> roleService.listMembers(9999999999L, PageQuery.normalized(1, 20, null), null))
            .isInstanceOf(NotFoundException.class);
    }
}
