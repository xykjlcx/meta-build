package com.metabuild.common.security;

import java.util.Set;

/**
 * 数据权限范围值对象。
 */
public record DataScope(
    DataScopeType type,
    Set<Long> deptIds
) {
    public static DataScope all() {
        return new DataScope(DataScopeType.ALL, Set.of());
    }

    public static DataScope self() {
        return new DataScope(DataScopeType.SELF, Set.of());
    }
}
