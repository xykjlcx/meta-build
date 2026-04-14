package com.metabuild.platform.job.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.jooq.DSLContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

import static com.metabuild.schema.tables.MbOperationLog.MB_OPERATION_LOG;

/**
 * 操作日志定时清理任务。
 * 每天 02:00 执行，删除 90 天前的操作日志。
 * ShedLock 防止多实例并发执行。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OplogCleanupJob {

    private static final int RETAIN_DAYS = 90;
    private static final String JOB_NAME = "oplog-cleanup";

    private final JobLogService jobLogService;
    private final DSLContext dsl;

    @Scheduled(cron = "0 0 2 * * ?")
    @SchedulerLock(name = JOB_NAME, lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void execute() {
        OffsetDateTime startTime = OffsetDateTime.now();
        log.info("[{}] 开始清理 {} 天前的操作日志", JOB_NAME, RETAIN_DAYS);

        try {
            OffsetDateTime cutoff = startTime.minusDays(RETAIN_DAYS);
            int deleted = dsl.deleteFrom(MB_OPERATION_LOG)
                .where(MB_OPERATION_LOG.CREATED_AT.lt(cutoff))
                .execute();

            OffsetDateTime endTime = OffsetDateTime.now();
            log.info("[{}] 清理完成，共删除 {} 条记录", JOB_NAME, deleted);
            jobLogService.logSuccess(JOB_NAME, startTime, endTime);
        } catch (Exception e) {
            OffsetDateTime endTime = OffsetDateTime.now();
            log.error("[{}] 清理失败", JOB_NAME, e);
            jobLogService.logFailure(JOB_NAME, startTime, endTime, e.getMessage());
        }
    }
}
