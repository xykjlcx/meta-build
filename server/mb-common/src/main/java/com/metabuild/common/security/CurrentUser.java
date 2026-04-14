package com.metabuild.common.security;

import java.util.Set;

/**
 * 当前登录用户抽象——业务层读取用户信息的唯一入口。
 * 实现由 infra-security 提供（SaTokenCurrentUser），业务层零感知认证框架。
 */
public interface CurrentUser {
    boolean isAuthenticated();
    Long userId();
    String username();
    Long deptId();
    Long tenantId();
    Set<String> permissions();
    boolean hasPermission(String code);
    boolean hasAllPermissions(String... codes);
    boolean hasAnyPermission(String... codes);
    Set<String> roles();
    boolean hasRole(String roleCode);
    boolean isAdmin();
    DataScopeType dataScopeType();
    Set<Long> dataScopeDeptIds();
    boolean isSystem();
    Long userIdOrSystem();
    CurrentUserInfo snapshot();
}
