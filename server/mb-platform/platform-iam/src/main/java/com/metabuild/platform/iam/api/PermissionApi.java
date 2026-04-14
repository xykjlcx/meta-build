package com.metabuild.platform.iam.api;

import java.util.Set;

/**
 * 权限模块对外 API 接口（供 Sa-Token 权限回调使用）。
 */
public interface PermissionApi {

    /** 获取用户的权限码集合 */
    Set<String> getPermissions(Long userId);

    /** 获取用户的角色码集合 */
    Set<String> getRoles(Long userId);
}
