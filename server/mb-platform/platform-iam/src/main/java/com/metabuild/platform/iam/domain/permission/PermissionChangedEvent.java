package com.metabuild.platform.iam.domain.permission;

import java.util.Set;

/**
 * 权限变更事件：受影响用户的权限缓存需失效。
 * 模块内部事件，跨模块通信走门面层。
 */
public record PermissionChangedEvent(Set<Long> userIds) {}
