package com.metabuild.platform.notification.domain.channel;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * 微信 access_token 进程内缓存（Caffeine）。
 *
 * <p>微信官方 access_token 有效期 7200s，缓存设置 7000s 留 200s 安全余量，
 * 在过期前主动重拉。key = "MP:" + appId 或 "MINI:" + appId，避免公众号/小程序串号。
 */
@Component
public class WeChatAccessTokenCache {

    private final Cache<String, String> cache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(7000))
            .maximumSize(64)
            .build();

    /**
     * 命中返回缓存；未命中调用 loader 拉取并写入。
     */
    public String getOrLoad(String cacheKey, Supplier<String> loader) {
        return cache.get(cacheKey, k -> loader.get());
    }

    /**
     * 主动失效（如发现 token 过期 errcode=40001）。
     */
    public void invalidate(String cacheKey) {
        cache.invalidate(cacheKey);
    }
}
