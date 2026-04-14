package com.metabuild.common.security;

/**
 * 数据权限类型枚举。
 */
public enum DataScopeType {
    /** 全部数据 */
    ALL,
    /** 自定义部门集合 */
    CUSTOM_DEPT,
    /** 仅本部门 */
    OWN_DEPT,
    /** 本部门及子部门 */
    OWN_DEPT_AND_CHILD,
    /** 仅本人 */
    SELF
}
