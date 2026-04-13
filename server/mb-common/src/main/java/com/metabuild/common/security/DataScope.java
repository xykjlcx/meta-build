package com.metabuild.common.security;

import java.util.Set;

/**
 * 数据权限范围值对象。
 */
public record DataScope(
    DataScopeType type,
    Set<Long> deptIds
) {}
