package com.metabuild.infra.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 缓存失效辅助工具
 * <p>
 * 提供两种缓存失效模式：
 * 1. 事务提交后失效（afterCommit）：保证数据库已落盘再删除缓存，防止读到脏数据
 * 2. 立即失效：非事务场景使用
 * <p>
 * 明确禁止使用 allEntries=true 全量失效，防止缓存规模大时形同虚设（见反面教材 #4）。
 */
@Slf4j
@RequiredArgsConstructor
public class CacheEvictSupport {

    private final StringRedisTemplate redisTemplate;

    /**
     * 事务提交后删除缓存 key（afterCommit 保证数据库已落盘）。
     * <p>
     * 适用于写操作（insert/update/delete）之后，确保缓存与数据库最终一致。
     *
     * @param keys 需要失效的缓存 key 列表
     */
    public void evictAfterCommit(String... keys) {
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (String key : keys) {
                            redisTemplate.delete(key);
                            log.debug("缓存已失效: {}", key);
                        }
                    }
                }
        );
    }

    /**
     * 立即删除缓存 key（非事务场景）。
     * <p>
     * 适用于不在事务中的缓存清理，如定时任务、手动刷新等。
     *
     * @param keys 需要失效的缓存 key 列表
     */
    public void evict(String... keys) {
        for (String key : keys) {
            redisTemplate.delete(key);
            log.debug("缓存已立即失效: {}", key);
        }
    }

    /**
     * 计算带 jitter 的 TTL，防止缓存雪崩。
     * <p>
     * 在 baseTtlSeconds 基础上随机增加 [0, baseTtl * jitterPercent / 100] 的抖动时间。
     *
     * @param baseTtlSeconds 基础 TTL（秒）
     * @param jitterPercent  抖动比例（百分比，如 10 表示 10%）
     * @return 带随机抖动的 TTL（秒）
     */
    public long ttlWithJitter(long baseTtlSeconds, int jitterPercent) {
        long jitter = (long) (baseTtlSeconds * jitterPercent / 100.0 * Math.random());
        return baseTtlSeconds + jitter;
    }
}
