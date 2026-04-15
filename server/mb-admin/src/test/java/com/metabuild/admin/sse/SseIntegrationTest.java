package com.metabuild.admin.sse;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.infra.sse.SseMessageSender;
import com.metabuild.infra.sse.SseSessionRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SSE 基础设施集成测试。
 *
 * <p>测试连接管理、消息发送、多 tab 替换、force-logout 等核心行为。
 */
@AutoConfigureMockMvc
@DisplayName("SSE 基础设施集成测试")
class SseIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private SseSessionRegistry registry;

    @Autowired
    private SseMessageSender messageSender;

    // ===== 连接管理 =====

    @Test
    @DisplayName("注册连接后 registry 包含该用户")
    void register_addsUserToRegistry() {
        SseEmitter emitter = new SseEmitter();
        registry.register(1L, emitter);

        assertThat(registry.size()).isGreaterThanOrEqualTo(1);
        assertThat(registry.getOnlineUserIds()).contains(1L);
        assertThat(registry.get(1L)).isSameAs(emitter);

        // 清理
        registry.remove(1L, emitter);
    }

    @Test
    @DisplayName("移除连接后 registry 不再包含该用户")
    void remove_removesUserFromRegistry() {
        SseEmitter emitter = new SseEmitter();
        registry.register(2L, emitter);
        registry.remove(2L, emitter);

        assertThat(registry.get(2L)).isNull();
    }

    @Test
    @DisplayName("多 tab 场景：新连接注册时旧连接被替换")
    void register_replacesOldEmitter() {
        SseEmitter old = new SseEmitter(0L);
        SseEmitter current = new SseEmitter(0L);

        registry.register(3L, old);
        registry.register(3L, current);

        assertThat(registry.get(3L)).isSameAs(current);

        // 清理
        registry.remove(3L, current);
    }

    @Test
    @DisplayName("remove 只移除匹配的 emitter（防误删）")
    void remove_onlyMatchingEmitter() {
        SseEmitter emitter1 = new SseEmitter();
        SseEmitter emitter2 = new SseEmitter();

        registry.register(4L, emitter2);
        // 尝试用 emitter1 移除 — 应该不生效
        registry.remove(4L, emitter1);

        assertThat(registry.get(4L)).isSameAs(emitter2);

        // 清理
        registry.remove(4L, emitter2);
    }

    // ===== 消息发送 =====

    @Test
    @DisplayName("sendToUser 对不在线用户不报错")
    void sendToUser_offlineUser_noError() {
        // 不应抛异常
        messageSender.sendToUser(999L, "test-event", Map.of("key", "value"));
    }

    @Test
    @DisplayName("broadcast 对空 registry 不报错")
    void broadcast_emptyRegistry_noError() {
        messageSender.broadcast("test-broadcast", Map.of("msg", "hello"));
    }

    @Test
    @DisplayName("getOnlineUserIds 返回当前在线用户集合")
    void getOnlineUserIds_returnsRegisteredUsers() {
        SseEmitter e1 = new SseEmitter();
        SseEmitter e2 = new SseEmitter();

        registry.register(10L, e1);
        registry.register(11L, e2);

        assertThat(messageSender.getOnlineUserIds()).contains(10L, 11L);

        // 清理
        registry.remove(10L, e1);
        registry.remove(11L, e2);
    }

    // ===== force-logout =====

    @Test
    @DisplayName("forceLogout 移除连接并写入 Redis 兜底标记")
    void forceLogout_removesEmitterAndWritesRedis(
            @Autowired org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        SseEmitter emitter = new SseEmitter(0L);
        registry.register(20L, emitter);

        messageSender.forceLogout(20L, "管理员踢出");

        // 连接已移除
        assertThat(registry.get(20L)).isNull();
        // Redis 标记已写入
        assertThat(redisTemplate.hasKey("mb:kicked:20")).isTrue();

        // 清理 Redis
        redisTemplate.delete("mb:kicked:20");
    }

    @Test
    @DisplayName("forceLogout 对不在线用户仍写 Redis 兜底标记")
    void forceLogout_offlineUser_stillWritesRedis(
            @Autowired org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        messageSender.forceLogout(21L, "管理员踢出");

        assertThat(redisTemplate.hasKey("mb:kicked:21")).isTrue();

        // 清理
        redisTemplate.delete("mb:kicked:21");
    }
}
