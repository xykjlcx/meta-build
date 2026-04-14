package com.metabuild.platform.iam.domain.session;

import com.metabuild.schema.tables.records.MbIamLoginLogRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;

/**
 * 登录日志服务（异步写入，不影响主流程）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginLogService {

    private final LoginLogRepository loginLogRepository;
    private final Clock clock;

    /** 记录登录成功日志（异步） */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(Long userId, String username) {
        insertLog(userId, username, true, null);
    }

    /** 记录登录失败日志（异步） */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(String username, String reason) {
        insertLog(null, username, false, reason);
    }

    private void insertLog(Long userId, String username, boolean success, String failureReason) {
        try {
            var record = new MbIamLoginLogRecord();
            record.setUserId(userId);
            record.setUsername(username);
            record.setSuccess(success);
            record.setFailureReason(failureReason);
            record.setCreatedAt(OffsetDateTime.now(clock));
            loginLogRepository.insert(record);
        } catch (Exception e) {
            log.error("写入登录日志失败: username={}, error={}", username, e.getMessage(), e);
        }
    }
}
