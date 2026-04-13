package com.metabuild.common.security;

/**
 * 数据权限类型枚举。
 */
public enum DataScopeType {
    /** 全部数据 */
    ALL,
    /** 本部门及子部门 */
    DEPT_AND_CHILDREN,
    /** 仅本部门 */
    DEPT_ONLY,
    /** 仅本人 */
    SELF_ONLY
}
