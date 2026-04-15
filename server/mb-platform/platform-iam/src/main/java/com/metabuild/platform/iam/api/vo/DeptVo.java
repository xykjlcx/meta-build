package com.metabuild.platform.iam.api.vo;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 部门视图 DTO（含子部门，用于树形展示）。
 */
public record DeptVo(
    Long id,
    Long parentId,
    String name,
    Long leaderUserId,
    Short status,
    Integer sortOrder,
    OffsetDateTime createdAt,
    List<DeptVo> children
) {}
