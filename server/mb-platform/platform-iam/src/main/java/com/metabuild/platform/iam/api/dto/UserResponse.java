package com.metabuild.platform.iam.api.dto;

import java.time.OffsetDateTime;

/**
 * 用户响应 DTO。
 */
public record UserResponse(
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
