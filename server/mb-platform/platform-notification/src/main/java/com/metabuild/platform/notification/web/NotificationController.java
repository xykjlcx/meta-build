package com.metabuild.platform.notification.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.notification.api.dto.NotificationCreateCommand;
import com.metabuild.platform.notification.api.dto.NotificationView;
import com.metabuild.platform.notification.domain.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 通知公告管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @RequirePermission("notification:notification:list")
    public PageResult<NotificationView> list(PageQuery query) {
        return notificationService.list(query);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("notification:notification:create")
    public Long create(@Valid @RequestBody NotificationCreateCommand request) {
        return notificationService.create(request);
    }

    @PostMapping("/{id}/read")
    @RequirePermission("notification:notification:read")
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("notification:notification:delete")
    public void delete(@PathVariable Long id) {
        notificationService.delete(id);
    }
}
