package com.metabuild.infra.cache;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * 缓存自动配置
 * <p>
 * 基于 Redis 的缓存管理器配置，提供：
 * - 默认 TTL（从 mb.cache.defaultTtlSeconds 读取）
 * - JSON 序列化（使用 GenericJackson2JsonRedisSerializer）
 * - CacheEvictSupport 工具 Bean（key 级别精确失效，事务安全）
 */
@AutoConfiguration(before = CacheAutoConfiguration.class)
@EnableCaching
@EnableConfigurationProperties(MbCacheProperties.class)
public class MbCacheAutoConfiguration {

    /**
     * 配置 Redis 缓存管理器，设置默认 TTL 和 JSON 序列化策略。
     * 使用 @ConditionalOnMissingBean 允许使用者覆盖此 Bean（如需自定义序列化或多级缓存）。
     */
    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory,
                                          MbCacheProperties props) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                // 使用配置的默认 TTL
                .entryTtl(Duration.ofSeconds(props.defaultTtlSeconds()))
                // key 使用 String 序列化
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                // value 使用 JSON 序列化（保留类型信息，支持反序列化）
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer()))
                // 不缓存 null 值，防止缓存穿透静默扩散
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }

    /**
     * 注册 CacheEvictSupport，提供事务安全的精确 key 失效能力
     */
    @Bean
    public CacheEvictSupport cacheEvictSupport(StringRedisTemplate stringRedisTemplate) {
        return new CacheEvictSupport(stringRedisTemplate);
    }
}
