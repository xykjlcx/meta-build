package com.metabuild.platform.config.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbConfigRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbConfig.MB_CONFIG;

/**
 * 系统配置数据访问层（仅 jOOQ）。
 */
@Repository
@RequiredArgsConstructor
public class ConfigRepository {

    private final DSLContext dsl;

    public Optional<MbConfigRecord> findByKey(String configKey) {
        return dsl.selectFrom(MB_CONFIG)
            .where(MB_CONFIG.CONFIG_KEY.eq(configKey))
            .fetchOptional();
    }

    public Optional<MbConfigRecord> findById(Long id) {
        return dsl.selectFrom(MB_CONFIG)
            .where(MB_CONFIG.ID.eq(id))
            .fetchOptional();
    }

    public PageResult<MbConfigRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_CONFIG)
            .allow("configKey", MB_CONFIG.CONFIG_KEY)
            .allow("updatedAt", MB_CONFIG.UPDATED_AT)
            .defaultSort(MB_CONFIG.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_CONFIG);
        List<MbConfigRecord> records = dsl.selectFrom(MB_CONFIG)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    public void upsert(MbConfigRecord record) {
        // 若 key 已存在则 update，否则 insert
        boolean exists = dsl.fetchExists(
            dsl.selectFrom(MB_CONFIG).where(MB_CONFIG.CONFIG_KEY.eq(record.getConfigKey()))
        );
        if (exists) {
            dsl.update(MB_CONFIG)
                .set(MB_CONFIG.CONFIG_VALUE, record.getConfigValue())
                .set(MB_CONFIG.CONFIG_TYPE, record.getConfigType())
                .set(MB_CONFIG.REMARK, record.getRemark())
                .set(MB_CONFIG.UPDATED_BY, record.getUpdatedBy())
                .set(MB_CONFIG.UPDATED_AT, record.getUpdatedAt())
                .where(MB_CONFIG.CONFIG_KEY.eq(record.getConfigKey()))
                .execute();
        } else {
            dsl.insertInto(MB_CONFIG).set(record).execute();
        }
    }

    public void deleteByKey(String configKey) {
        dsl.deleteFrom(MB_CONFIG).where(MB_CONFIG.CONFIG_KEY.eq(configKey)).execute();
    }
}
