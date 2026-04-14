package com.metabuild.business.notice.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 发布公告命令（含发送目标列表）。
 */
public record NoticePublishCommand(
    @NotEmpty @Valid List<NoticeTarget> targets
) {}
