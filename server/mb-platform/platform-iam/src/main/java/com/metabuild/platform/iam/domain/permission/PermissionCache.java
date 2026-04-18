package com.metabuild.platform.iam.domain.permission;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

/**
 * 用户权限码缓存（Redis）。
 * <p>
 * key: {@code mb:iam:perm:{userId}}，value: 扁平的权限码集合 JSON。
 * TTL 24h 兜底防 Redis 重启脏数据；写权限/角色绑定后由事件驱动主动失效。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PermissionCache {

    private static final String KEY_PREFIX = "mb:iam:perm:";
    private static final Duration TTL = Duration.ofHours(24);
    private static final TypeReference<LinkedHashSet<String>> TYPE_REF = new TypeReference<>() {};

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public Optional<Set<String>> get(Long userId) {
        String json = redisTemplate.opsForValue().get(key(userId));
        if (json == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(json, TYPE_REF));
        } catch (Exception e) {
            log.warn("权限缓存反序列化失败 userId={}, 已视为未命中", userId, e);
            return Optional.empty();
        }
    }

    public void put(Long userId, Set<String> codes) {
        try {
            String json = objectMapper.writeValueAsString(codes);
            redisTemplate.opsForValue().set(key(userId), json, TTL);
        } catch (Exception e) {
            log.warn("权限缓存写入失败 userId={}", userId, e);
        }
    }

    public void evict(Long userId) {
        redisTemplate.delete(key(userId));
    }

    public void evictBatch(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return;
        redisTemplate.delete(userIds.stream().map(PermissionCache::key).toList());
    }

    private static String key(Long userId) {
        return KEY_PREFIX + userId;
    }
}
