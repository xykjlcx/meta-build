package com.metabuild.platform.job.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.platform.job.api.dto.JobLogView;
import com.metabuild.schema.tables.records.MbJobLogRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;

/**
 * 定时任务日志业务服务（写日志 + 查询）。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobLogService {

    private final JobLogRepository repository;
    private final SnowflakeIdGenerator idGenerator;
    private final Clock clock;

    /**
     * 分页查询任务日志。
     */
    public PageResult<JobLogView> list(PageQuery query) {
        return repository.findPage(query).map(this::toResponse);
    }

    /**
     * 写入一条成功的任务日志。
     */
    @Transactional
    public void logSuccess(String jobName, OffsetDateTime startTime, OffsetDateTime endTime) {
        MbJobLogRecord record = new MbJobLogRecord();
        record.setId(idGenerator.nextId());
        record.setJobName(jobName);
        record.setStatus("SUCCESS");
        record.setStartTime(startTime);
        record.setEndTime(endTime);
        record.setDurationMs(endTime.toInstant().toEpochMilli() - startTime.toInstant().toEpochMilli());
        record.setCreatedAt(OffsetDateTime.now(clock));
        repository.insert(record);
    }

    /**
     * 写入一条失败的任务日志。
     */
    @Transactional
    public void logFailure(String jobName, OffsetDateTime startTime, OffsetDateTime endTime, String errorMessage) {
        MbJobLogRecord record = new MbJobLogRecord();
        record.setId(idGenerator.nextId());
        record.setJobName(jobName);
        record.setStatus("FAILURE");
        record.setStartTime(startTime);
        record.setEndTime(endTime);
        record.setDurationMs(endTime.toInstant().toEpochMilli() - startTime.toInstant().toEpochMilli());
        record.setErrorMessage(errorMessage != null && errorMessage.length() > 1000
            ? errorMessage.substring(0, 1000) : errorMessage);
        record.setCreatedAt(OffsetDateTime.now(clock));
        repository.insert(record);
    }

    private JobLogView toResponse(MbJobLogRecord r) {
        return new JobLogView(
            r.getId(), r.getJobName(), r.getStatus(),
            r.getStartTime(), r.getEndTime(), r.getDurationMs(),
            r.getErrorMessage(), r.getCreatedAt()
        );
    }
}
