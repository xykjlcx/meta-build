package com.metabuild.platform.notification.api;

import com.metabuild.platform.notification.api.dto.NotificationCreateCommand;

/**
 * 通知模块对外 API 接口。
 * <p>
 * business 层通过此接口调用 platform-notification 的能力，
 * 不直接依赖 domain 层的 {@code NotificationService}。
 */
public interface NotificationApi {

    /**
     * 创建一条通知。
     *
     * @param command 创建命令
     * @return 通知 ID
     */
    Long create(NotificationCreateCommand command);
}
