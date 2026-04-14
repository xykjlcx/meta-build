package com.metabuild.platform.notification.web;

import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.notification.domain.NotificationLogService;
import com.metabuild.platform.notification.domain.NotificationLogView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 通知发送记录查询 API。
 *
 * <p>查询某条公告（或其他业务模块）的各渠道发送状态。
 * 通过 NotificationLogService 访问数据（ArchUnit 规则禁止 Controller 直接持有 Repository）。
 */
@RestController
@RequestMapping("/api/v1/notification-logs")
@RequiredArgsConstructor
@Tag(name = "通知发送记录", description = "通知分发日志查询")
public class NotificationLogController {

    private final NotificationLogService logService;

    @GetMapping
    @RequirePermission("notice:notice:detail")
    @Operation(summary = "按模块和关联 ID 查询发送记录")
    public List<NotificationLogView> findByModuleAndRef(
            @Parameter(description = "来源模块", example = "notice") @RequestParam String module,
            @Parameter(description = "关联业务 ID", example = "123456") @RequestParam String referenceId) {
        return logService.findByModuleAndRef(module, referenceId);
    }
}
