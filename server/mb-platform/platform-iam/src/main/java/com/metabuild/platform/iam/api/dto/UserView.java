package com.metabuild.platform.iam.api.dto;

import java.time.OffsetDateTime;

/**
 * 用户视图 DTO（只读，供响应使用）。
 */
public record UserView(
    Long id,
    String username,
    String email,
    String phone,
    String nickname,
    String avatar,
    Long deptId,
    Short status,
    boolean mustChangePassword,
    OffsetDateTime passwordUpdatedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
