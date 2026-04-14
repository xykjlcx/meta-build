package com.metabuild.infra.security;

import cn.dev33.satoken.stp.StpUtil;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.CurrentUserInfo;
import com.metabuild.common.security.DataScopeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * CurrentUser 的 Sa-Token 实现，从 Sa-Token Session 中读取用户信息。
 * RequestScope 保证每次请求使用独立实例，避免线程安全问题。
 */
@Slf4j
@Component
@RequestScope
public class SaTokenCurrentUser implements CurrentUser {

    // Session Extra 键名常量
    static final String KEY_USERNAME = "username";
    static final String KEY_DEPT_ID = "deptId";
    static final String KEY_TENANT_ID = "tenantId";
    static final String KEY_PERMISSIONS = "permissions";
    static final String KEY_ROLES = "roles";
    static final String KEY_DATA_SCOPE_TYPE = "dataScopeType";
    static final String KEY_DATA_SCOPE_DEPT_IDS = "dataScopeDeptIds";
    static final String KEY_IS_ADMIN = "isAdmin";

    @Override
    public boolean isAuthenticated() {
        return StpUtil.isLogin();
    }

    @Override
    public Long userId() {
        return StpUtil.getLoginIdAsLong();
    }

    @Override
    public String username() {
        return (String) StpUtil.getSession().get(KEY_USERNAME);
    }

    @Override
    public Long deptId() {
        Object val = StpUtil.getSession().get(KEY_DEPT_ID);
        return val instanceof Long l ? l : val instanceof Number n ? n.longValue() : null;
    }

    @Override
    public Long tenantId() {
        Object val = StpUtil.getSession().get(KEY_TENANT_ID);
        return val instanceof Long l ? l : val instanceof Number n ? n.longValue() : null;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Set<String> permissions() {
        Object val = StpUtil.getSession().get(KEY_PERMISSIONS);
        if (val instanceof Set) return (Set<String>) val;
        return Set.of();
    }

    @Override
    public boolean hasPermission(String code) {
        return isAdmin() || permissions().contains(code);
    }

    @Override
    public boolean hasAllPermissions(String... codes) {
        if (isAdmin()) return true;
        Set<String> perms = permissions();
        return Arrays.stream(codes).allMatch(perms::contains);
    }

    @Override
    public boolean hasAnyPermission(String... codes) {
        if (isAdmin()) return true;
        Set<String> perms = permissions();
        return Arrays.stream(codes).anyMatch(perms::contains);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Set<String> roles() {
        Object val = StpUtil.getSession().get(KEY_ROLES);
        if (val instanceof Set) return (Set<String>) val;
        return Set.of();
    }

    @Override
    public boolean hasRole(String roleCode) {
        return isAdmin() || roles().contains(roleCode);
    }

    @Override
    public boolean isAdmin() {
        Object val = StpUtil.getSession().get(KEY_IS_ADMIN);
        return Boolean.TRUE.equals(val);
    }

    @Override
    public DataScopeType dataScopeType() {
        Object val = StpUtil.getSession().get(KEY_DATA_SCOPE_TYPE);
        if (val instanceof DataScopeType dst) return dst;
        if (val instanceof String s) {
            try {
                return DataScopeType.valueOf(s);
            } catch (IllegalArgumentException e) {
                log.warn("无效的 DataScopeType 值: {}", s);
            }
        }
        return DataScopeType.SELF;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Set<Long> dataScopeDeptIds() {
        Object val = StpUtil.getSession().get(KEY_DATA_SCOPE_DEPT_IDS);
        if (val instanceof Set) return (Set<Long>) val;
        return Set.of();
    }

    @Override
    public boolean isSystem() {
        // 系统级用户：userId = 0 或特殊标记
        return Long.valueOf(0L).equals(userId());
    }

    @Override
    public Long userIdOrSystem() {
        return isSystem() ? 0L : userId();
    }

    @Override
    public CurrentUserInfo snapshot() {
        return new CurrentUserInfo(
                userId(),
                username(),
                deptId(),
                tenantId(),
                new HashSet<>(permissions()),
                dataScopeType(),
                new HashSet<>(dataScopeDeptIds())
        );
    }
}
