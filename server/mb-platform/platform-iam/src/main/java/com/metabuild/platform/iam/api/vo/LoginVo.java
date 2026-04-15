package com.metabuild.platform.iam.api.vo;

import java.util.Set;

/**
 * 登录成功视图 DTO（API 响应专用）。
 * <p>
 * 对应内部 LoginResult，但移除了 dataScopeType / dataScopeDeptIds 字段，
 * 这些字段是服务端内部鉴权信息，不应暴露到 API 响应中。
 */
public record LoginVo(
    String accessToken,
    String refreshToken,
    Long expiresInSeconds,
    UserSummary user
) {

    /**
     * 登录成功返回的用户摘要（不含数据权限细节）。
     */
    public record UserSummary(
        Long userId,
        String username,
        Long deptId,
        Set<String> permissions
    ) {}
}
