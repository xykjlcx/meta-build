package com.metabuild.business.notice.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 更新公告命令。
 */
public record NoticeUpdateCmd(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 50000) String content,
    Boolean pinned,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    @Size(max = 10) List<Long> attachmentFileIds,
    @NotNull Integer version
) {}
