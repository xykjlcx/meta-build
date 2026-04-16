package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Set;

/**
 * 登录成功视图 DTO（API 响应专用）。
 * <p>
 * 对应内部 LoginResult，但移除了 dataScopeType / dataScopeDeptIds 字段，
 * 这些字段是服务端内部鉴权信息，不应暴露到 API 响应中。
 */
public record LoginVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String accessToken,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String refreshToken,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Long expiresInSeconds,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    UserSummary user
) {

    /**
     * 登录成功返回的用户摘要（不含数据权限细节）。
     */
    public record UserSummary(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long userId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String username,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Long deptId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Set<String> permissions
    ) {}
}
