package com.metabuild.platform.notification.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建通知公告命令。
 */
public record NotificationCreateCmd(
    @NotBlank @Size(max = 255) String title,
    String content,
    @Size(max = 32) String type
) {}
