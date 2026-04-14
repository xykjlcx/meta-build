package com.metabuild.platform.log.domain;

import com.metabuild.schema.tables.records.MbLogOperationRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 操作日志异步写入器。
 * 使用 @Async 确保日志写入不阻塞请求响应链路。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OperationLogWriter {

    private final OperationLogRepository repository;

    /**
     * 异步写入操作日志。
     */
    @Async
    public void writeAsync(MbLogOperationRecord record) {
        try {
            repository.insert(record);
        } catch (Exception e) {
            // 日志写入失败不影响业务，仅打印警告
            log.warn("操作日志写入失败: module={}, operation={}, error={}",
                record.getModule(), record.getOperation(), e.getMessage());
        }
    }
}
