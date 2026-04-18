package com.metabuild.platform.iam.web;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.vo.CurrentUserMenuVo;
import com.metabuild.platform.iam.api.cmd.MenuCreateCmd;
import com.metabuild.platform.iam.api.cmd.MenuUpdateCmd;
import com.metabuild.platform.iam.api.vo.MenuVo;
import com.metabuild.platform.iam.domain.menu.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 菜单管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final CurrentUser currentUser;

    /**
     * 获取当前用户可见的菜单树 + 权限列表（前端 useMenu 依赖）。
     * 需要认证，不需要额外权限，登录即可访问。
     */
    @GetMapping("/current-user")
    public CurrentUserMenuVo currentUserMenu() {
        List<MenuVo> tree = menuService.currentUserMenuTree();
        return new CurrentUserMenuVo(tree, currentUser.permissions());
    }

    @GetMapping
    @RequirePermission("iam:menu:list")
    public List<MenuVo> tree() {
        return menuService.tree();
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:menu:detail")
    public MenuVo getById(@PathVariable Long id) {
        return menuService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:menu:create")
    public MenuVo create(@Valid @RequestBody MenuCreateCmd request) {
        Long id = menuService.createMenu(request);
        return menuService.getById(id);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:menu:update")
    public MenuVo update(@PathVariable Long id, @Valid @RequestBody MenuUpdateCmd request) {
        return menuService.updateMenu(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("iam:menu:delete")
    public void delete(@PathVariable Long id) {
        menuService.deleteMenu(id);
    }
}
