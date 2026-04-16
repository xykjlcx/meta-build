package com.metabuild.platform.config.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.cache.CacheEvictSupport;
import com.metabuild.platform.config.api.ConfigErrorCodes;
import com.metabuild.platform.config.api.vo.ConfigVo;
import com.metabuild.platform.config.api.cmd.ConfigSetCmd;
import com.metabuild.schema.tables.records.MbConfigRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;

/**
 * 系统配置业务服务（get/set/delete + Spring Cache）。
 * 缓存名：config，key 为配置键（configKey）。
 * TTL 由 mb.cache.defaultTtlSeconds 统一控制（默认 3600 秒）。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConfigService {

    /** Spring Cache Redis key 前缀，格式：{cacheName}::{key} */
    private static final String CACHE_PREFIX = "config::";

    private final ConfigRepository repository;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;
    private final Clock clock;
    private final CacheEvictSupport cacheEvictSupport;

    public PageResult<ConfigVo> list(PageQuery query) {
        return repository.findPage(query).map(this::toResponse);
    }

    /**
     * 按 key 查询配置项，结果缓存到 Spring Cache（Redis）。
     * 缓存未命中时查 DB 并自动写入缓存。
     */
    @Cacheable(cacheNames = "config", key = "#configKey")
    public ConfigVo getByKey(String configKey) {
        return repository.findByKey(configKey)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException(ConfigErrorCodes.ITEM_NOT_FOUND, configKey));
    }

    @Transactional
    public void set(ConfigSetCmd req) {
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
                record.setCreatedAt(OffsetDateTime.now(clock));
            }
        );
        record.setTenantId(0L);
        record.setConfigKey(req.configKey());
        record.setConfigValue(req.configValue());
        record.setConfigType(req.configType() != null ? req.configType() : "SYSTEM");
        record.setRemark(req.remark());
        record.setVersion(0);
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setUpdatedAt(OffsetDateTime.now(clock));

        repository.upsert(record);
        // 事务提交后再失效缓存，防止提交前缓存被其他请求重新填入旧数据
        cacheEvictSupport.evictAfterCommit(CACHE_PREFIX + req.configKey());
    }

    @Transactional
    public void deleteByKey(String configKey) {
        if (repository.deleteByKey(configKey) == 0) {
            throw new NotFoundException(ConfigErrorCodes.ITEM_NOT_FOUND, configKey);
        }
        // 事务提交后再失效缓存
        cacheEvictSupport.evictAfterCommit(CACHE_PREFIX + configKey);
    }

    private ConfigVo toResponse(MbConfigRecord r) {
        return new ConfigVo(
            r.getId(), r.getConfigKey(), r.getConfigValue(),
            r.getConfigType(), r.getRemark(), r.getUpdatedAt()
        );
    }
}
