package com.metabuild.platform.config.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.cache.CacheEvictSupport;
import com.metabuild.platform.config.api.dto.ConfigResponse;
import com.metabuild.platform.config.api.dto.ConfigSetRequest;
import com.metabuild.schema.tables.records.MbConfigRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.NoSuchElementException;

/**
 * 系统配置业务服务（get/set/delete + Redis 缓存）。
 * 缓存 key 规范：config:{key}
 */
@Service
@RequiredArgsConstructor
public class ConfigService {

    private static final String CACHE_PREFIX = "config:";
    private static final long CACHE_TTL_SECONDS = 3600L;

    private final ConfigRepository repository;
    private final CacheEvictSupport cacheEvictSupport;
    private final StringRedisTemplate redisTemplate;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;

    public PageResult<ConfigResponse> list(PageQuery query) {
        return repository.findPage(query).map(this::toResponse);
    }

    public ConfigResponse getByKey(String configKey) {
        // 先查 Redis
        String cached = redisTemplate.opsForValue().get(CACHE_PREFIX + configKey);
        if (cached != null) {
            // 缓存命中：从 DB 取完整信息（简化实现：不缓存整个 DTO，避免序列化依赖）
        }
        return repository.findByKey(configKey)
            .map(this::toResponse)
            .orElseThrow(() -> new NoSuchElementException("配置项不存在: " + configKey));
    }

    @Transactional
    public void set(ConfigSetRequest req) {
        MbConfigRecord record = new MbConfigRecord();
        // 检查是否已存在（复用原 id）
        repository.findByKey(req.configKey()).ifPresentOrElse(
            existing -> {
                record.setId(existing.getId());
                record.setCreatedBy(existing.getCreatedBy());
                record.setCreatedAt(existing.getCreatedAt());
            },
            () -> {
                record.setId(idGenerator.nextId());
                record.setCreatedBy(currentUser.userIdOrSystem());
                record.setCreatedAt(OffsetDateTime.now());
            }
        );
        record.setTenantId(0L);
        record.setConfigKey(req.configKey());
        record.setConfigValue(req.configValue());
        record.setConfigType(req.configType() != null ? req.configType() : "SYSTEM");
        record.setRemark(req.remark());
        record.setVersion(0);
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setUpdatedAt(OffsetDateTime.now());

        repository.upsert(record);
        cacheEvictSupport.evictAfterCommit(CACHE_PREFIX + req.configKey());
    }

    @Transactional
    public void deleteByKey(String configKey) {
        repository.deleteByKey(configKey);
        cacheEvictSupport.evictAfterCommit(CACHE_PREFIX + configKey);
    }

    private ConfigResponse toResponse(MbConfigRecord r) {
        return new ConfigResponse(
            r.getId(), r.getConfigKey(), r.getConfigValue(),
            r.getConfigType(), r.getRemark(), r.getUpdatedAt()
        );
    }
}
