package com.metabuild.platform.iam.api;

import com.metabuild.platform.iam.api.dto.DeptResponse;
import java.util.List;

/**
 * 部门模块对外 API 接口（供跨模块调用）。
 */
public interface DeptApi {

    DeptResponse getById(Long id);

    List<DeptResponse> tree();
}
