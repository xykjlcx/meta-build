package com.metabuild.platform.iam.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.dto.AssignRolesRequest;
import com.metabuild.platform.iam.api.dto.ChangePasswordRequest;
import com.metabuild.platform.iam.api.dto.UserCreateRequest;
import com.metabuild.platform.iam.api.dto.UserResponse;
import com.metabuild.platform.iam.api.dto.UserUpdateRequest;
import com.metabuild.platform.iam.domain.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    @RequirePermission("iam:user:list")
    public PageResult<UserResponse> list(PageQuery query) {
        return userService.list(query);
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:user:detail")
    public UserResponse getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:user:create")
    public UserResponse create(@Valid @RequestBody UserCreateRequest request) {
        Long id = userService.createUser(request);
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:user:update")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
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
    public void changeMyPassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.userId(), request);
    }

    /** 管理员重置用户密码 */
    @PostMapping("/{id}/reset-password")
    @RequirePermission("iam:user:resetPassword")
    public void resetPassword(@PathVariable Long id, @RequestBody String newPassword) {
        userService.resetPassword(id, newPassword);
    }

    /** 为用户分配角色 */
    @PutMapping("/{id}/roles")
    @RequirePermission("iam:user:assignRole")
    public void assignRoles(@PathVariable Long id, @Valid @RequestBody AssignRolesRequest request) {
        roleService.assignRolesToUser(id, request);
    }
}
