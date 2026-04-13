package com.metabuild.common.security;

import java.util.Set;

/**
 * CurrentUser 的可序列化快照 DTO。
 */
public record CurrentUserInfo(
    Long userId,
    String username,
    Long deptId,
    long tenantId,
    Set<String> permissions,
    DataScopeType dataScopeType,
    Set<Long> dataScopeDeptIds
) {}
