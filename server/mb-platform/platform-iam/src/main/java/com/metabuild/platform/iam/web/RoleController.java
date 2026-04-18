package com.metabuild.platform.iam.web;

import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.web.pagination.PageRequestDto;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.cmd.RoleCreateCmd;
import com.metabuild.platform.iam.api.vo.RoleMenusVo;
import com.metabuild.platform.iam.api.vo.RoleVo;
import com.metabuild.platform.iam.api.cmd.RoleUpdateCmd;
import com.metabuild.platform.iam.api.vo.UserVo;
import com.metabuild.platform.iam.domain.menu.MenuService;
import com.metabuild.platform.iam.domain.role.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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
    private final PaginationPolicy paginationPolicy;

    @GetMapping
    @RequirePermission("iam:role:list")
    public PageResult<RoleVo> list(@ParameterObject PageRequestDto request) {
        return roleService.listPage(paginationPolicy.normalize(request));
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:role:detail")
    public RoleVo getById(@PathVariable Long id) {
        return roleService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:role:create")
    public RoleVo create(@Valid @RequestBody RoleCreateCmd request) {
        Long id = roleService.createRole(request);
        return roleService.getById(id);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:role:update")
    public RoleVo update(@PathVariable Long id, @Valid @RequestBody RoleUpdateCmd request) {
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

    /** 查角色已分配的菜单 ID 列表（编辑态回显） */
    @GetMapping("/{id}/menus")
    @RequirePermission("iam:role:detail")
    public RoleMenusVo getMenus(@PathVariable Long id) {
        return new RoleMenusVo(menuService.findMenuIdsByRoleId(id));
    }

    /** 查角色成员（分页 + keyword 模糊，含启用+禁用） */
    @GetMapping("/{id}/members")
    @RequirePermission("iam:role:viewMembers")
    public PageResult<UserVo> listMembers(
        @PathVariable Long id,
        @ParameterObject PageRequestDto request,
        @RequestParam(required = false) String keyword
    ) {
        return roleService.listMembers(id, paginationPolicy.normalize(request), keyword);
    }
}
