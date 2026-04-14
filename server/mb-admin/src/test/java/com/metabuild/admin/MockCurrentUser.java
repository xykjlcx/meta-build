package com.metabuild.admin;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.CurrentUserInfo;
import com.metabuild.common.security.DataScopeType;

import java.util.Arrays;
import java.util.Set;

/**
 * 测试用 CurrentUser 实现——模拟已登录用户，不依赖 Sa-Token。
 */
public class MockCurrentUser implements CurrentUser {

    private final Long userId;
    private final String username;
    private final Set<String> permissions;
    private final boolean admin;
    private final Long deptId;
    private final DataScopeType dataScopeType;
    private final Set<Long> dataScopeDeptIds;

    public MockCurrentUser(Long userId, String username, Set<String> permissions, boolean admin) {
        this(userId, username, permissions, admin, 0L, admin ? DataScopeType.ALL : DataScopeType.SELF, Set.of());
    }

    public MockCurrentUser(Long userId, String username, Set<String> permissions, boolean admin,
                           Long deptId, DataScopeType dataScopeType, Set<Long> dataScopeDeptIds) {
        this.userId = userId;
        this.username = username;
        this.permissions = permissions;
        this.admin = admin;
        this.deptId = deptId;
        this.dataScopeType = dataScopeType;
        this.dataScopeDeptIds = dataScopeDeptIds;
    }

    // ───────── 工厂方法 ─────────

    /** 超管用户（数据权限 ALL） */
    public static MockCurrentUser admin() {
        return new MockCurrentUser(1L, "admin", Set.of(), true);
    }

    /** 普通用户（数据权限 SELF） */
    public static MockCurrentUser user(Long id, String username) {
        return new MockCurrentUser(id, username, Set.of(), false);
    }

    /** 带权限集合的普通用户 */
    public static MockCurrentUser userWithPermissions(Long id, String username, String... perms) {
        return new MockCurrentUser(id, username, Set.of(perms), false);
    }

    /** 指定数据权限范围的用户（供 DataScope 集成测试使用） */
    public static MockCurrentUser userWithDataScope(Long id, String username, Long deptId,
                                                    DataScopeType scopeType, Set<Long> scopeDeptIds) {
        return new MockCurrentUser(id, username, Set.of(), false, deptId, scopeType, scopeDeptIds);
    }

    // ───────── CurrentUser 接口实现 ─────────

    @Override
    public boolean isAuthenticated() {
        return userId != null;
    }

    @Override
    public Long userId() {
        return userId;
    }

    @Override
    public String username() {
        return username;
    }

    @Override
    public Long deptId() {
        return deptId;
    }

    @Override
    public Long tenantId() {
        return null;
    }

    @Override
    public Set<String> permissions() {
        return permissions;
    }

    @Override
    public boolean hasPermission(String code) {
        return admin || permissions.contains(code);
    }

    @Override
    public boolean hasAllPermissions(String... codes) {
        if (admin) return true;
        return Arrays.stream(codes).allMatch(permissions::contains);
    }

    @Override
    public boolean hasAnyPermission(String... codes) {
        if (admin) return true;
        return Arrays.stream(codes).anyMatch(permissions::contains);
    }

    @Override
    public Set<String> roles() {
        return admin ? Set.of("admin") : Set.of();
    }

    @Override
    public boolean hasRole(String roleCode) {
        return admin || roles().contains(roleCode);
    }

    @Override
    public boolean isAdmin() {
        return admin;
    }

    @Override
    public DataScopeType dataScopeType() {
        return dataScopeType;
    }

    @Override
    public Set<Long> dataScopeDeptIds() {
        return dataScopeDeptIds;
    }

    @Override
    public boolean isSystem() {
        return Long.valueOf(0L).equals(userId);
    }

    @Override
    public Long userIdOrSystem() {
        return isSystem() ? 0L : userId;
    }

    @Override
    public CurrentUserInfo snapshot() {
        return new CurrentUserInfo(
            userId,
            username,
            deptId(),
            tenantId(),
            permissions,
            dataScopeType(),
            dataScopeDeptIds()
        );
    }
}
