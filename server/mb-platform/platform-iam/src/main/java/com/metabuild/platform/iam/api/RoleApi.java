package com.metabuild.platform.iam.api;

import com.metabuild.platform.iam.api.vo.RoleVo;
import java.util.List;

/**
 * 角色模块对外 API 接口（供跨模块调用）。
 */
public interface RoleApi {

    RoleVo getById(Long id);

    List<RoleVo> listByUserId(Long userId);
}
