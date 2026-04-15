package com.metabuild.platform.iam.api;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.platform.iam.api.vo.UserVo;

/**
 * 用户模块对外 API 接口（供跨模块调用）。
 */
public interface UserApi {

    UserVo getById(Long id);

    PageResult<UserVo> list(PageQuery query);
}
