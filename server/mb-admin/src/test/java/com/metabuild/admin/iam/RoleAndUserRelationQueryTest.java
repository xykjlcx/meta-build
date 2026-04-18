package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.iam.api.cmd.AssignRolesCmd;
import com.metabuild.platform.iam.api.cmd.MenuCreateCmd;
import com.metabuild.platform.iam.api.cmd.RoleCreateCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.domain.menu.MenuService;
import com.metabuild.platform.iam.domain.role.RoleService;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A4/A5 关联查询测试：roleId→menuIds 和 userId→roleIds。
 */
@Import(TestSecurityConfig.class)
class RoleAndUserRelationQueryTest extends BaseIntegrationTest {

    @Autowired
    private RoleService roleService;

    @Autowired
    private MenuService menuService;

    @Autowired
    private UserService userService;

    // ───────── A4 GET /roles/:id/menus（Service 层）─────────

    @Test
    void findMenuIdsByRoleId_should_return_empty_when_no_assignment() {
        Long roleId = roleService.createRole(new RoleCreateCmd(
            "空菜单角色", "empty_menus_role", "SELF", null, 1
        ));

        List<Long> menuIds = menuService.findMenuIdsByRoleId(roleId);
        assertThat(menuIds).isEmpty();
    }

    @Test
    void findMenuIdsByRoleId_should_return_assigned_menus() {
        Long m1 = menuService.createMenu(new MenuCreateCmd(null, "相关菜单1", "rel:m1:view", "MENU", null, 1, true));
        Long m2 = menuService.createMenu(new MenuCreateCmd(null, "相关菜单2", "rel:m2:view", "MENU", null, 2, true));

        Long roleId = roleService.createRole(new RoleCreateCmd("有菜单角色", "role_with_menus", "SELF", null, 1));
        menuService.assignMenusToRole(roleId, List.of(m1, m2));

        List<Long> menuIds = menuService.findMenuIdsByRoleId(roleId);
        assertThat(menuIds).containsExactlyInAnyOrder(m1, m2);
    }

    @Test
    void findMenuIdsByRoleId_should_throw_not_found_when_role_missing() {
        assertThatThrownBy(() -> menuService.findMenuIdsByRoleId(9999999999L))
            .isInstanceOf(NotFoundException.class);
    }

    // ───────── A5 GET /users/:id/roles（Service 层）─────────

    @Test
    void findRoleIdsByUserId_should_return_empty_when_no_assignment() {
        Long userId = userService.createUser(new UserCreateCmd("usernorole", "Test@12345", "norole@example.com", null, null, null));

        List<Long> roleIds = roleService.findRoleIdsByUserId(userId);
        assertThat(roleIds).isEmpty();
    }

    @Test
    void findRoleIdsByUserId_should_return_assigned_roles() {
        Long r1 = roleService.createRole(new RoleCreateCmd("分配角色1", "assigned_role_1", "SELF", null, 1));
        Long r2 = roleService.createRole(new RoleCreateCmd("分配角色2", "assigned_role_2", "SELF", null, 2));

        Long userId = userService.createUser(new UserCreateCmd("userwithroles", "Test@12345", "withroles@example.com", null, null, null));
        roleService.assignRolesToUser(userId, new AssignRolesCmd(List.of(r1, r2)));

        List<Long> roleIds = roleService.findRoleIdsByUserId(userId);
        assertThat(roleIds).containsExactlyInAnyOrder(r1, r2);
    }

    @Test
    void findRoleIdsByUserId_should_throw_not_found_when_user_missing() {
        assertThatThrownBy(() -> roleService.findRoleIdsByUserId(9999999999L))
            .isInstanceOf(NotFoundException.class);
    }
}
