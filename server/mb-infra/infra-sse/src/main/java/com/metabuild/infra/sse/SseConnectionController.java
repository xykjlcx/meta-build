package com.metabuild.infra.sse;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.metabuild.common.security.CurrentUser;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Duration;

/**
 * SSE 连接端点。
 *
 * <p>GET /api/v1/sse/connect — 建立 SSE 长连接。
 * 已登录用户才能建连（走全局 SaInterceptor 认证）。
 *
 * <p>每用户每分钟 5 次建连限制（防止异常客户端频繁重连），使用 Bucket4j 手写限流。
 * 全局连接数上限由 SseProperties.maxConnections 控制。
 */
@RestController
@RequestMapping("/api/v1/sse")
@RequiredArgsConstructor
@Tag(name = "SSE", description = "SSE 实时推送")
public class SseConnectionController {

    private static final Logger log = LoggerFactory.getLogger(SseConnectionController.class);

    /** 每用户限流桶：5 次/分钟，2 分钟无访问自动清除（防内存泄漏） */
    private static final Cache<Long, Bucket> RATE_LIMIT_BUCKETS = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(2))
            .maximumSize(10_000)
            .build();

    private final SseSessionRegistry registry;
    private final SseProperties properties;
    private final CurrentUser currentUser;

    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "建立 SSE 连接", description = "已登录用户建立 SSE 长连接，接收实时消息")
    public SseEmitter connect() {
        Long userId = currentUser.userId();

        // 每用户每分钟 5 次建连限流（Bucket4j）
        Bucket bucket = RATE_LIMIT_BUCKETS.get(userId, id ->
                Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(5)
                                .refillGreedy(5, Duration.ofMinutes(1))
                                .build())
                        .build());
        if (!bucket.tryConsume(1)) {
            log.warn("SSE 建连限流：用户 {} 每分钟建连次数超过 5 次", userId);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "建连过于频繁，请稍后重试");
        }

        // 全局连接数限制
        if (registry.size() >= properties.maxConnections()) {
            log.warn("SSE 连接数已达上限 {}，拒绝用户 {} 连接", properties.maxConnections(), userId);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SSE 连接数已达上限");
        }

        SseEmitter emitter = new SseEmitter(properties.emitterTimeoutMs());
        registry.register(userId, emitter);

        // 连接生命周期回调
        emitter.onCompletion(() -> {
            registry.remove(userId, emitter);
            log.debug("SSE 连接完成: userId={}", userId);
        });
        emitter.onTimeout(() -> {
            registry.remove(userId, emitter);
            log.debug("SSE 连接超时: userId={}", userId);
        });
        emitter.onError(e -> {
            registry.remove(userId, emitter);
            log.debug("SSE 连接异常: userId={}, error={}", userId, e.getMessage());
        });

        log.info("SSE 连接建立: userId={}, 当前在线={}", userId, registry.size());
        return emitter;
    }
}
