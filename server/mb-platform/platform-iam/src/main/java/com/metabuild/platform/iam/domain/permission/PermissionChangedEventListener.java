package com.metabuild.platform.iam.domain.permission;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 监听 PermissionChangedEvent，异步失效 Redis 缓存。
 * 事件已由 Facade 在 afterCommit 发出，监听器只负责删 key。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PermissionChangedEventListener {

    private final PermissionCache permissionCache;

    @Async
    @EventListener
    public void on(PermissionChangedEvent event) {
        permissionCache.evictBatch(event.userIds());
        log.debug("权限缓存已失效: userIds={}", event.userIds());
    }
}
