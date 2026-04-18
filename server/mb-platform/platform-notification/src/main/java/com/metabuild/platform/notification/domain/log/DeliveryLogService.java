package com.metabuild.platform.notification.domain.log;

import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 通知投递日志服务（异步落表，不阻塞主投递路径）。
 */
@Service
@RequiredArgsConstructor
public class DeliveryLogService {

    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_TIMEOUT = "TIMEOUT";
    public static final String STATUS_FAILED = "FAILED";

    private static final Logger log = LoggerFactory.getLogger(DeliveryLogService.class);

    private final DeliveryLogRepository deliveryLogRepository;

    @Async("mbAsyncExecutor")
    public void record(NotificationMessage message,
                       String channel,
                       String status,
                       long durationMs,
                       Throwable error) {
        String errorCode = null;
        String errorMessage = null;
        if (error != null) {
            errorMessage = error.getClass().getSimpleName() + ": " + (error.getMessage() == null ? "" : error.getMessage());
            if (error instanceof NotificationException ne) {
                errorCode = ne.getCode();
            } else {
                errorCode = error.getClass().getSimpleName();
            }
        }
        try {
            deliveryLogRepository.insert(message, channel, status, durationMs, errorCode, errorMessage);
        } catch (RuntimeException e) {
            log.error("投递日志落表失败 channel={} status={} durationMs={} exceptionType={} message={}",
                    channel, status, durationMs, e.getClass().getSimpleName(), e.getMessage());
        }
    }
}
