package com.metabuild.infra.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

/**
 * SSE 消息发送实现。
 *
 * <p>单播/广播使用 SseSessionRegistry 的 ConcurrentHashMap；
 * force-logout 同时写 Redis SET 兜底（即使 SSE 断线也能在下次 HTTP 请求时拦截）。
 */
@RequiredArgsConstructor
public class SseMessageSenderImpl implements SseMessageSender {

    private static final Logger log = LoggerFactory.getLogger(SseMessageSenderImpl.class);

    /** Redis key 前缀：踢人下线兜底标记 */
    private static final String KICKED_KEY_PREFIX = "mb:kicked:";
    /** 踢人标记过期时间 */
    private static final Duration KICKED_TTL = Duration.ofHours(24);

    private final SseSessionRegistry registry;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void sendToUser(Long userId, String event, Object payload) {
        SseEmitter emitter = registry.get(userId);
        if (emitter != null) {
            doSend(userId, emitter, event, payload);
        }
    }

    @Override
    public void broadcast(String event, Object payload) {
        registry.forEach((userId, emitter) -> doSend(userId, emitter, event, payload));
    }

    @Override
    public void forceLogout(Long userId, String reason) {
        // 1. SSE 推送 force-logout 事件
        sendToUser(userId, "force-logout", Map.of("reason", reason));

        // 2. Redis 兜底标记（即使 SSE 断线，下次 HTTP 请求也会触发登出）
        String key = KICKED_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, "1", KICKED_TTL);
        log.info("用户 {} 被强制下线，原因：{}，Redis 兜底标记已写入", userId, reason);

        // 3. 关闭 SSE 连接
        SseEmitter emitter = registry.get(userId);
        if (emitter != null) {
            emitter.complete();
            registry.remove(userId, emitter);
        }
    }

    @Override
    public Set<Long> getOnlineUserIds() {
        return registry.getOnlineUserIds();
    }

    /**
     * 发送 SSE 事件的内部方法。发送失败时移除连接。
     */
    private void doSend(Long userId, SseEmitter emitter, String event, Object payload) {
        try {
            String data = objectMapper.writeValueAsString(payload);
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (IOException e) {
            log.debug("SSE 发送失败（用户 {} 可能已断开）: {}", userId, e.getMessage());
            registry.remove(userId, emitter);
        }
    }
}
