package com.metabuild.platform.job.domain;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

import static com.metabuild.schema.tables.MbLogOperation.MB_LOG_OPERATION;

/**
 * 操作日志清理 Repository（仅供定时清理任务使用）。
 * DSLContext 封装在 Repository 层，不暴露给 Job/Service 层。
 */
@Repository
@RequiredArgsConstructor
public class OperationLogCleanupRepository {

    private final DSLContext dsl;

    /**
     * 删除指定截止时间之前的操作日志。
     *
     * @param cutoff 截止时间，早于此时间的日志将被删除
     * @return 实际删除的记录数
     */
    public int deleteOlderThan(OffsetDateTime cutoff) {
        return dsl.deleteFrom(MB_LOG_OPERATION)
            .where(MB_LOG_OPERATION.CREATED_AT.lt(cutoff))
            .execute();
    }
}
