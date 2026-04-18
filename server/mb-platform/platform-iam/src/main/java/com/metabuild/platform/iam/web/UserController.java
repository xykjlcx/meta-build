package com.metabuild.platform.iam.web;

import com.metabuild.common.dto.PageResult;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.cmd.AssignRolesCmd;
import com.metabuild.platform.iam.api.cmd.ChangePasswordCmd;
import com.metabuild.platform.iam.api.cmd.ResetPasswordCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.api.cmd.UserListQuery;
import com.metabuild.platform.iam.api.vo.UserListVo;
import com.metabuild.platform.iam.api.vo.UserRolesVo;
import com.metabuild.platform.iam.api.vo.UserVo;
import com.metabuild.platform.iam.api.cmd.UserUpdateCmd;
import com.metabuild.platform.iam.domain.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.metabuild.platform.iam.domain.role.RoleService;

/**
 * 用户管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RoleService roleService;
    private final CurrentUser currentUser;
    private final PaginationPolicy paginationPolicy;

    @GetMapping
    @RequirePermission("iam:user:list")
    public PageResult<UserListVo> list(@ParameterObject UserListRequestDto request) {
        UserListQuery query = new UserListQuery(
            paginationPolicy.normalize(request),
            request.getDeptId(),
            Boolean.TRUE.equals(request.getIncludeDescendants()),
            request.getStatus(),
            request.getKeyword()
        );
        return userService.listForAdmin(query);
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:user:detail")
    public UserVo getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:user:create")
    public UserVo create(@Valid @RequestBody UserCreateCmd request) {
        Long id = userService.createUser(request);
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:user:update")
    public UserVo update(@PathVariable Long id, @Valid @RequestBody UserUpdateCmd request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("iam:user:delete")
    public void delete(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    /** 修改自己的密码（不需要权限，但需要登录） */
    @PutMapping("/me/password")
    public void changeMyPassword(@Valid @RequestBody ChangePasswordCmd request) {
        userService.changePassword(currentUser.userId(), request);
    }

    /** 管理员重置用户密码 */
    @PostMapping("/{id}/reset-password")
    @RequirePermission("iam:user:resetPassword")
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordCmd request) {
        userService.resetPassword(id, request.newPassword());
    }

    /** 为用户分配角色 */
    @PutMapping("/{id}/roles")
    @RequirePermission("iam:user:assignRole")
    public void assignRoles(@PathVariable Long id, @Valid @RequestBody AssignRolesCmd request) {
        roleService.assignRolesToUser(id, request);
    }

    /** 查用户已分配的角色 ID 列表（编辑态回显） */
    @GetMapping("/{id}/roles")
    @RequirePermission("iam:user:detail")
    public UserRolesVo getRoles(@PathVariable Long id) {
        return new UserRolesVo(roleService.findRoleIdsByUserId(id));
    }
}
