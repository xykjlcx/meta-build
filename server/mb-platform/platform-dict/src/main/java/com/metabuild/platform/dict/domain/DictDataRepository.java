package com.metabuild.platform.dict.domain;

import com.metabuild.schema.tables.records.MbDictDataRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbDictData.MB_DICT_DATA;

/**
 * 字典数据访问层（仅 jOOQ）。
 */
@Repository
@RequiredArgsConstructor
public class DictDataRepository {

    private final DSLContext dsl;

    public Optional<MbDictDataRecord> findById(Long id) {
        return dsl.selectFrom(MB_DICT_DATA)
            .where(MB_DICT_DATA.ID.eq(id))
            .fetchOptional();
    }

    public List<MbDictDataRecord> findByDictTypeId(Long dictTypeId) {
        return dsl.selectFrom(MB_DICT_DATA)
            .where(MB_DICT_DATA.DICT_TYPE_ID.eq(dictTypeId))
            .orderBy(MB_DICT_DATA.SORT_ORDER.asc(), MB_DICT_DATA.ID.asc())
            .fetch();
    }

    public Long insert(MbDictDataRecord record) {
        dsl.insertInto(MB_DICT_DATA).set(record).execute();
        return record.getId();
    }

    public int update(MbDictDataRecord record) {
        return dsl.update(MB_DICT_DATA)
            .set(record)
            .where(MB_DICT_DATA.ID.eq(record.getId()))
            .and(MB_DICT_DATA.VERSION.eq(record.getVersion() - 1))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_DICT_DATA).where(MB_DICT_DATA.ID.eq(id)).execute();
    }

    public void deleteByDictTypeId(Long dictTypeId) {
        dsl.deleteFrom(MB_DICT_DATA).where(MB_DICT_DATA.DICT_TYPE_ID.eq(dictTypeId)).execute();
    }
}
