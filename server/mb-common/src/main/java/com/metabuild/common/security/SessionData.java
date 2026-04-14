package com.metabuild.common.security;

/**
 * 登录时写入 session 的数据。
 */
public record SessionData(
    Long userId,
    String username,
    Long deptId,
    Long tenantId,
    DataScope dataScope,
    boolean mustChangePassword
) {}
