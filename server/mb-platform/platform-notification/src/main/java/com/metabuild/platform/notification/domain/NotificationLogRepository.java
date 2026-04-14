package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Clock;

/**
 * 通知发送记录 Repository。
 *
 * <p>Task 8 完成 DDL + jOOQ codegen 后补充完整实现。
 */
@Repository
@RequiredArgsConstructor
public class NotificationLogRepository {

    private final DSLContext dsl;
    private final Clock clock;

    /**
     * 记录发送成功。
     *
     * @param message     通知消息
     * @param channelType 渠道类型
     */
    public void logSuccess(NotificationMessage message, String channelType) {
        // Task 8 补充完整实现
    }

    /**
     * 记录发送失败。
     *
     * @param message      通知消息
     * @param channelType  渠道类型
     * @param errorMessage 失败原因
     */
    public void logFailure(NotificationMessage message, String channelType, String errorMessage) {
        // Task 8 补充完整实现
    }
}
