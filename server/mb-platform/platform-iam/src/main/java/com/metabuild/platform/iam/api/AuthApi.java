package com.metabuild.platform.iam.api;

import com.metabuild.common.security.LoginResult;
import com.metabuild.platform.iam.api.dto.LoginCommand;

/**
 * 认证模块对外 API 接口（供跨模块调用）。
 */
public interface AuthApi {

    LoginResult login(LoginCommand request);

    void logout();
}
