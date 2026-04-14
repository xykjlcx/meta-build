package com.metabuild.platform.iam.api;

import com.metabuild.platform.iam.api.dto.RoleResponse;
import java.util.List;

/**
 * 角色模块对外 API 接口（供跨模块调用）。
 */
public interface RoleApi {

    RoleResponse getById(Long id);

    List<RoleResponse> listByUserId(Long userId);
}
