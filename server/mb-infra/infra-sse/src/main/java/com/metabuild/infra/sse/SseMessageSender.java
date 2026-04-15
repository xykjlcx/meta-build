package com.metabuild.infra.sse;

import java.util.Set;

/**
 * SSE 消息发送接口（infra 层对外 API）。
 *
 * <p>业务层通过此接口发送实时消息，不需要感知 SSE 实现细节。
 */
public interface SseMessageSender {

    /**
     * 发送给指定用户。
     *
     * @param userId  目标用户 ID
     * @param event   SSE 事件名称（如 notice-published、force-logout）
     * @param payload 消息体（会被 JSON 序列化）
     */
    void sendToUser(Long userId, String event, Object payload);

    /**
     * 全局广播（发送给所有在线用户）。
     *
     * @param event   SSE 事件名称
     * @param payload 消息体
     */
    void broadcast(String event, Object payload);

    /**
     * 踢人下线：SSE 推送 force-logout 事件 + 关闭连接 + 写 Redis 兜底标记。
     *
     * <p>双保险设计：即使 SSE 连接已断开，下次 HTTP 请求时
     * Sa-Token 中间件检查 Redis SET mb:kicked:{userId} 也会触发登出。
     *
     * @param userId 要踢出的用户 ID
     * @param reason 踢出原因（展示给用户）
     */
    void forceLogout(Long userId, String reason);

    /**
     * 获取当前在线用户 ID 集合。
     */
    Set<Long> getOnlineUserIds();
}
