package com.metabuild.infra.security;

import cn.dev33.satoken.stp.StpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * force-logout Redis 兜底拦截器。
 *
 * <p>每次 HTTP 请求检查 Redis key mb:kicked:{userId}，
 * 如果存在则清除登录态 + 删除 Redis 标记 + 返回 401。
 *
 * <p>设计意图：即使 SSE 推送的 force-logout 消息未送达（网络断开等），
 * 用户下次发起任何 HTTP 请求时也会被拦截。
 *
 * <p>注意：此拦截器使用 StpUtil（Sa-Token），位于 infra-security 模块——
 * 符合 ArchUnit 规则 {@code ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN}，
 * 只有 infra-security 和 infra-exception 可以依赖 Sa-Token。
 *
 * <p>注意：spec 原设计用 Redis SET（opsForSet），此处改用 String + TTL，
 * 更简洁且满足需求（只需判断 key 是否存在）。
 */
public class ForceLogoutCheckInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ForceLogoutCheckInterceptor.class);
    private static final String KICKED_KEY_PREFIX = "mb:kicked:";

    private final StringRedisTemplate redisTemplate;

    public ForceLogoutCheckInterceptor(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // 只有已登录用户才检查
        if (!StpUtil.isLogin()) {
            return true;
        }

        Long userId = StpUtil.getLoginIdAsLong();
        String key = KICKED_KEY_PREFIX + userId;

        Boolean kicked = redisTemplate.hasKey(key);
        if (Boolean.TRUE.equals(kicked)) {
            log.info("Redis 兜底拦截：用户 {} 已被标记强制下线，清除登录态", userId);
            // 删除 Redis 标记（一次性使用）
            redisTemplate.delete(key);
            // 清除 Sa-Token 登录态
            StpUtil.logout(userId);
            // 返回 401
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"status\":401,\"detail\":\"您已被管理员强制下线\"}");
            return false;
        }

        return true;
    }
}
