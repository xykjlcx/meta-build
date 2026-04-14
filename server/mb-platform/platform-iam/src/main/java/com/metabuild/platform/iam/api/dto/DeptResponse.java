package com.metabuild.platform.iam.api.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 部门响应 DTO（含子部门，用于树形展示）。
 */
public record DeptResponse(
    Long id,
    Long parentId,
    String name,
    Long leaderUserId,
    Short status,
    Integer sortOrder,
    OffsetDateTime createdAt,
    List<DeptResponse> children
) {}
