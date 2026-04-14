package com.metabuild.infra.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

/**
 * SSE 心跳调度器。
 *
 * <p>每 30 秒向所有在线连接发送 SSE 注释行（:heartbeat），
 * 保活连接防止中间代理（Nginx/CDN）因超时关闭连接。
 *
 * <p>SSE 规范中以 : 开头的行为注释，客户端忽略但可保活连接。
 */
public class SseHeartbeatScheduler {

    private static final Logger log = LoggerFactory.getLogger(SseHeartbeatScheduler.class);

    private final SseSessionRegistry registry;

    public SseHeartbeatScheduler(SseSessionRegistry registry) {
        this.registry = registry;
    }

    @Scheduled(fixedRate = 30_000)
    public void heartbeat() {
        if (registry.size() == 0) {
            return;
        }
        registry.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException e) {
                registry.remove(userId, emitter);
                log.debug("心跳发送失败，移除连接: userId={}", userId);
            }
        });
    }
}
