package com.metabuild.infra.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiConsumer;

/**
 * SSE 在线用户 session 管理（v1 单实例：ConcurrentHashMap）。
 *
 * <p>每个用户只保留一个活跃连接。新连接注册时，旧连接收到 session-replaced 事件后关闭（多 tab 场景）。
 *
 * <p>v1.5 多实例部署时升级为 Redis Pub/Sub 广播。
 */
public class SseSessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(SseSessionRegistry.class);

    // v1 单实例：ConcurrentHashMap 足够
    private final ConcurrentHashMap<Long, SseEmitter> sessions = new ConcurrentHashMap<>();

    /**
     * 注册新连接。如果该用户已有旧连接，先发 session-replaced 事件再关闭旧连接。
     *
     * @param userId  用户 ID
     * @param emitter 新的 SseEmitter
     */
    public void register(Long userId, SseEmitter emitter) {
        SseEmitter old = sessions.put(userId, emitter);
        if (old != null) {
            try {
                old.send(SseEmitter.event().name("session-replaced").data(""));
            } catch (IOException ignored) {
                // 旧连接可能已断开，忽略
            }
            old.complete();
            log.debug("用户 {} 旧 SSE 连接已被替换（多 tab 场景）", userId);
        }
    }

    /**
     * 移除连接（仅当当前 emitter 匹配时移除，防止并发注册时误删新连接）。
     */
    public void remove(Long userId, SseEmitter emitter) {
        sessions.remove(userId, emitter);
    }

    /**
     * 获取指定用户的 emitter。
     */
    public SseEmitter get(Long userId) {
        return sessions.get(userId);
    }

    /**
     * 当前在线连接数。
     */
    public int size() {
        return sessions.size();
    }

    /**
     * 获取所有在线用户 ID（不可修改视图）。
     */
    public Set<Long> getOnlineUserIds() {
        return Collections.unmodifiableSet(sessions.keySet());
    }

    /**
     * 遍历所有在线连接（用于心跳、广播等场景）。
     */
    public void forEach(BiConsumer<Long, SseEmitter> action) {
        sessions.forEach(action);
    }
}
