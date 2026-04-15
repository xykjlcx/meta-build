package com.metabuild.infra.security;

import com.metabuild.common.exception.CommonErrorCodes;
import com.metabuild.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

/**
 * Refresh Token 管理服务。
 *
 * <p>使用 Redis 存储 refresh token（one-time use + rotation），
 * 与 Sa-Token JWT access token 分离，独立生命周期。
 *
 * <p>Key 格式：{@code mb:refresh:<token>} → userId 字符串。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String PREFIX = "mb:refresh:";

    private final StringRedisTemplate redisTemplate;
    private final MbAuthProperties authProperties;

    /**
     * 生成 refresh token 并持久化到 Redis（TTL = authProperties.refreshTimeout()）。
     *
     * @param userId 用户 ID
     * @return 随机 UUID refresh token（32 位 hex）
     */
    public String createRefreshToken(Long userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        String key = PREFIX + token;
        redisTemplate.opsForValue().set(
                key,
                String.valueOf(userId),
                Duration.ofSeconds(authProperties.refreshTimeout())
        );
        log.debug("Refresh token 已创建: userId={}", userId);
        return token;
    }

    /**
     * 验证 refresh token 并轮换（one-time use）：验证后立即删除，防止重放攻击。
     *
     * @param refreshToken 客户端传入的 refresh token
     * @return 对应的 userId
     * @throws UnauthorizedException token 无效或已过期
     */
    public Long validateAndRotate(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException(CommonErrorCodes.AUTH_REFRESH_TOKEN_INVALID);
        }
        String key = PREFIX + refreshToken;
        String userIdStr = redisTemplate.opsForValue().getAndDelete(key);
        if (userIdStr == null) {
            log.warn("Refresh token 无效或已过期: token={}...", refreshToken.substring(0, Math.min(8, refreshToken.length())));
            throw new UnauthorizedException(CommonErrorCodes.AUTH_REFRESH_TOKEN_INVALID);
        }
        return Long.parseLong(userIdStr);
    }

    /**
     * 撤销指定 token（改密/主动登出时调用）。
     *
     * @param refreshToken 要撤销的 token
     */
    public void revoke(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            redisTemplate.delete(PREFIX + refreshToken);
        }
    }
}
