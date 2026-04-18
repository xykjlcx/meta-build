package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.iam.api.cmd.MenuCreateCmd;
import com.metabuild.platform.iam.api.cmd.MenuUpdateCmd;
import com.metabuild.platform.iam.api.vo.MenuVo;
import com.metabuild.platform.iam.domain.menu.MenuService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * MenuService 更新路径集成测试。
 */
@Import(TestSecurityConfig.class)
class MenuServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MenuService menuService;

    // ───────── 正常更新 ─────────

    @Test
    void updateMenu_should_update_name_type_permission_and_icon() {
        Long id = menuService.createMenu(new MenuCreateCmd(
            null, "测试菜单1", "test:m1:view", "MENU", "icon-1", 1, true
        ));

        MenuVo updated = menuService.updateMenu(id, new MenuUpdateCmd(
            null, "测试菜单1改名", "test:m1:read", "MENU", "icon-2", 2, false
        ));

        assertThat(updated.name()).isEqualTo("测试菜单1改名");
        assertThat(updated.permissionCode()).isEqualTo("test:m1:read");
        assertThat(updated.icon()).isEqualTo("icon-2");
        assertThat(updated.sortOrder()).isEqualTo(2);
        assertThat(updated.visible()).isFalse();
    }

    // ───────── 防环 ─────────

    @Test
    void updateMenu_should_reject_self_as_parent() {
        Long id = menuService.createMenu(new MenuCreateCmd(
            null, "自环菜单", null, "DIRECTORY", null, 1, true
        ));

        assertThatThrownBy(() -> menuService.updateMenu(id, new MenuUpdateCmd(
            id, "自环菜单", null, "DIRECTORY", null, 1, true
        )))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.menu.parentCircular");
    }

    @Test
    void updateMenu_should_reject_descendant_as_parent() {
        Long root = menuService.createMenu(new MenuCreateCmd(null, "环根", null, "DIRECTORY", null, 1, true));
        Long mid = menuService.createMenu(new MenuCreateCmd(root, "环中", null, "DIRECTORY", null, 1, true));
        Long leaf = menuService.createMenu(new MenuCreateCmd(mid, "环叶", "test:leaf:view", "MENU", null, 1, true));

        assertThatThrownBy(() -> menuService.updateMenu(root, new MenuUpdateCmd(
            leaf, "环根", null, "DIRECTORY", null, 1, true
        )))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.menu.parentCircular");
    }

    // ───────── 有 children 禁改 BUTTON ─────────

    @Test
    void updateMenu_should_reject_button_type_when_has_children() {
        Long parent = menuService.createMenu(new MenuCreateCmd(null, "父菜单", null, "DIRECTORY", null, 1, true));
        menuService.createMenu(new MenuCreateCmd(parent, "子菜单", "test:c:view", "MENU", null, 1, true));

        assertThatThrownBy(() -> menuService.updateMenu(parent, new MenuUpdateCmd(
            null, "父菜单", "test:p:btn", "BUTTON", null, 1, true
        )))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.menu.childrenExist");
    }

    // ───────── BUTTON 必须有 permissionCode ─────────

    @Test
    void updateMenu_should_reject_button_without_permission_code() {
        Long id = menuService.createMenu(new MenuCreateCmd(
            null, "按钮菜单", "test:btn:old", "BUTTON", null, 1, true
        ));

        assertThatThrownBy(() -> menuService.updateMenu(id, new MenuUpdateCmd(
            null, "按钮菜单", null, "BUTTON", null, 1, true
        )))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.menu.buttonPermissionRequired");
    }

    // ───────── permissionCode 全局唯一 ─────────

    @Test
    void updateMenu_should_reject_duplicate_permission_code() {
        menuService.createMenu(new MenuCreateCmd(null, "菜单A", "test:unique:a", "MENU", null, 1, true));
        Long b = menuService.createMenu(new MenuCreateCmd(null, "菜单B", "test:unique:b", "MENU", null, 1, true));

        assertThatThrownBy(() -> menuService.updateMenu(b, new MenuUpdateCmd(
            null, "菜单B", "test:unique:a", "MENU", null, 1, true
        )))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("iam.menu.permissionCodeDuplicate");
    }

    @Test
    void updateMenu_should_allow_null_permission_code_in_multiple_directories() {
        menuService.createMenu(new MenuCreateCmd(null, "目录1", null, "DIRECTORY", null, 1, true));
        Long dir2 = menuService.createMenu(new MenuCreateCmd(null, "目录2", null, "DIRECTORY", null, 1, true));

        // 两个 DIRECTORY 都无 permissionCode，不应该互相冲突
        MenuVo updated = menuService.updateMenu(dir2, new MenuUpdateCmd(
            null, "目录2改名", null, "DIRECTORY", null, 1, true
        ));
        assertThat(updated.name()).isEqualTo("目录2改名");
    }

    @Test
    void updateMenu_should_allow_keeping_same_permission_code() {
        Long id = menuService.createMenu(new MenuCreateCmd(
            null, "保码测试", "test:keep:code", "MENU", null, 1, true
        ));

        // permissionCode 没变但其他字段变
        MenuVo updated = menuService.updateMenu(id, new MenuUpdateCmd(
            null, "保码测试改名", "test:keep:code", "MENU", "new-icon", 2, true
        ));
        assertThat(updated.name()).isEqualTo("保码测试改名");
        assertThat(updated.icon()).isEqualTo("new-icon");
    }

    // ───────── 不存在 ─────────

    @Test
    void updateMenu_should_throw_not_found_when_id_missing() {
        assertThatThrownBy(() -> menuService.updateMenu(9999999999L, new MenuUpdateCmd(
            null, "不存在", null, "MENU", null, 1, true
        )))
            .isInstanceOf(NotFoundException.class);
    }
}
