package com.metabuild.platform.dict.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbDictTypeRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbDictType.MB_DICT_TYPE;

/**
 * 字典类型数据访问层（仅 jOOQ）。
 */
@Repository
@RequiredArgsConstructor
public class DictTypeRepository {

    private final DSLContext dsl;

    public Optional<MbDictTypeRecord> findById(Long id) {
        return dsl.selectFrom(MB_DICT_TYPE)
            .where(MB_DICT_TYPE.ID.eq(id))
            .fetchOptional();
    }

    public Optional<MbDictTypeRecord> findByCode(String code) {
        return dsl.selectFrom(MB_DICT_TYPE)
            .where(MB_DICT_TYPE.CODE.eq(code))
            .fetchOptional();
    }

    public boolean existsByCode(String code) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_DICT_TYPE).where(MB_DICT_TYPE.CODE.eq(code))
        );
    }

    public PageResult<MbDictTypeRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_DICT_TYPE)
            .allow("name", MB_DICT_TYPE.NAME)
            .allow("code", MB_DICT_TYPE.CODE)
            .allow("createdAt", MB_DICT_TYPE.CREATED_AT)
            .defaultSort(MB_DICT_TYPE.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_DICT_TYPE);
        List<MbDictTypeRecord> records = dsl.selectFrom(MB_DICT_TYPE)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    public Long insert(MbDictTypeRecord record) {
        dsl.insertInto(MB_DICT_TYPE).set(record).execute();
        return record.getId();
    }

    public int update(MbDictTypeRecord record) {
        return dsl.update(MB_DICT_TYPE)
            .set(record)
            .where(MB_DICT_TYPE.ID.eq(record.getId()))
            .and(MB_DICT_TYPE.VERSION.eq(record.getVersion() - 1))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_DICT_TYPE).where(MB_DICT_TYPE.ID.eq(id)).execute();
    }
}
