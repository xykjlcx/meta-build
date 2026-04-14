package com.metabuild.platform.job.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbJobLogRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.MbJobLog.MB_JOB_LOG;

/**
 * 定时任务日志数据访问层（追加表，仅 insert/query）。
 */
@Repository
@RequiredArgsConstructor
public class JobLogRepository {

    private final DSLContext dsl;

    public void insert(MbJobLogRecord record) {
        dsl.insertInto(MB_JOB_LOG).set(record).execute();
    }

    public PageResult<MbJobLogRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_JOB_LOG)
            .allow("startTime", MB_JOB_LOG.START_TIME)
            .allow("jobName", MB_JOB_LOG.JOB_NAME)
            .defaultSort(MB_JOB_LOG.START_TIME.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_JOB_LOG);
        List<MbJobLogRecord> records = dsl.selectFrom(MB_JOB_LOG)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }
}
