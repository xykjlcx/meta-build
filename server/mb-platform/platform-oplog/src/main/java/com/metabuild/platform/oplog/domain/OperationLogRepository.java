package com.metabuild.platform.oplog.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbOperationLogRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.MbOperationLog.MB_OPERATION_LOG;

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
    public void insert(MbOperationLogRecord record) {
        dsl.insertInto(MB_OPERATION_LOG).set(record).execute();
    }

    /**
     * 分页查询操作日志。
     */
    public PageResult<MbOperationLogRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_OPERATION_LOG)
            .allow("createdAt", MB_OPERATION_LOG.CREATED_AT)
            .allow("module", MB_OPERATION_LOG.MODULE)
            .allow("userId", MB_OPERATION_LOG.USER_ID)
            .defaultSort(MB_OPERATION_LOG.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_OPERATION_LOG);
        List<MbOperationLogRecord> records = dsl.selectFrom(MB_OPERATION_LOG)
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
        return dsl.deleteFrom(MB_OPERATION_LOG)
            .where(MB_OPERATION_LOG.CREATED_AT.lt(cutoff))
            .execute();
    }
}
