package com.metabuild.platform.iam.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.dto.RoleCreateRequest;
import com.metabuild.platform.iam.api.dto.RoleResponse;
import com.metabuild.platform.iam.api.dto.RoleUpdateRequest;
import com.metabuild.platform.iam.domain.menu.MenuService;
import com.metabuild.platform.iam.domain.role.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 角色管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final MenuService menuService;

    @GetMapping
    @RequirePermission("iam:role:list")
    public PageResult<RoleResponse> list(PageQuery query) {
        return roleService.listPage(query);
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:role:detail")
    public RoleResponse getById(@PathVariable Long id) {
        return roleService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:role:create")
    public RoleResponse create(@Valid @RequestBody RoleCreateRequest request) {
        Long id = roleService.createRole(request);
        return roleService.getById(id);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:role:update")
    public RoleResponse update(@PathVariable Long id, @Valid @RequestBody RoleUpdateRequest request) {
        return roleService.updateRole(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("iam:role:delete")
    public void delete(@PathVariable Long id) {
        roleService.deleteRole(id);
    }

    /** 为角色分配菜单 */
    @PutMapping("/{id}/menus")
    @RequirePermission("iam:role:assignMenu")
    public void assignMenus(@PathVariable Long id, @RequestBody List<Long> menuIds) {
        menuService.assignMenusToRole(id, menuIds);
    }
}
