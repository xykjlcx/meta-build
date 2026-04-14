package com.metabuild.platform.job.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.platform.job.api.dto.JobLogResponse;
import com.metabuild.schema.tables.records.MbJobLogRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

/**
 * 定时任务日志业务服务（写日志 + 查询）。
 */
@Service
@RequiredArgsConstructor
public class JobLogService {

    private final JobLogRepository repository;
    private final SnowflakeIdGenerator idGenerator;

    /**
     * 分页查询任务日志。
     */
    public PageResult<JobLogResponse> list(PageQuery query) {
        return repository.findPage(query).map(this::toResponse);
    }

    /**
     * 写入一条成功的任务日志。
     */
    public void logSuccess(String jobName, OffsetDateTime startTime, OffsetDateTime endTime) {
        MbJobLogRecord record = new MbJobLogRecord();
        record.setId(idGenerator.nextId());
        record.setJobName(jobName);
        record.setStatus("SUCCESS");
        record.setStartTime(startTime);
        record.setEndTime(endTime);
        record.setDurationMs(endTime.toInstant().toEpochMilli() - startTime.toInstant().toEpochMilli());
        record.setCreatedAt(OffsetDateTime.now());
        repository.insert(record);
    }

    /**
     * 写入一条失败的任务日志。
     */
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
        record.setCreatedAt(OffsetDateTime.now());
        repository.insert(record);
    }

    private JobLogResponse toResponse(MbJobLogRecord r) {
        return new JobLogResponse(
            r.getId(), r.getJobName(), r.getStatus(),
            r.getStartTime(), r.getEndTime(), r.getDurationMs(),
            r.getErrorMessage(), r.getCreatedAt()
        );
    }
}
