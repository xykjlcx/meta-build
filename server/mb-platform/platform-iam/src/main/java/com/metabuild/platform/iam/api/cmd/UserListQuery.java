package com.metabuild.platform.iam.api.cmd;

import com.metabuild.common.dto.PageQuery;

/**
 * 用户列表查询参数（内部对象）。
 *
 * <p>Controller 从 {@code UserListRequestDto} 构造此对象后传给 UserService。
 */
public record UserListQuery(
    PageQuery page,
    Long deptId,
    boolean includeDescendants,
    Short status,
    String keyword
) {
    public boolean hasKeyword() {
        return keyword != null && !keyword.isBlank();
    }
}
