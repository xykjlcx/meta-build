package com.metabuild.platform.iam.api;

import com.metabuild.platform.iam.api.dto.RoleView;
import java.util.List;

/**
 * 角色模块对外 API 接口（供跨模块调用）。
 */
public interface RoleApi {

    RoleView getById(Long id);

    List<RoleView> listByUserId(Long userId);
}
