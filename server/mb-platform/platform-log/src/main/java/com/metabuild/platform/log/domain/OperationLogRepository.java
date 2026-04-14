package com.metabuild.platform.log.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbLogOperationRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.MbLogOperation.MB_LOG_OPERATION;

/**
 * 操作日志数据访问层（追加只读，无更新/删除）。
 */
@Repository
@RequiredArgsConstructor
public class OperationLogRepository {

    private final DSLContext dsl;

    /**
     * 写入一条操作日志（追加）。
     */
    public void insert(MbLogOperationRecord record) {
        dsl.insertInto(MB_LOG_OPERATION).set(record).execute();
    }

    /**
     * 分页查询操作日志。
     */
    public PageResult<MbLogOperationRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_LOG_OPERATION)
            .allow("createdAt", MB_LOG_OPERATION.CREATED_AT)
            .allow("module", MB_LOG_OPERATION.MODULE)
            .allow("userId", MB_LOG_OPERATION.USER_ID)
            .defaultSort(MB_LOG_OPERATION.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_LOG_OPERATION);
        List<MbLogOperationRecord> records = dsl.selectFrom(MB_LOG_OPERATION)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    /**
     * 删除指定天数之前的操作日志（定时清理使用）。
     */
    public int deleteOlderThanDays(int days) {
        var cutoff = java.time.OffsetDateTime.now().minusDays(days);
        return dsl.deleteFrom(MB_LOG_OPERATION)
            .where(MB_LOG_OPERATION.CREATED_AT.lt(cutoff))
            .execute();
    }
}
