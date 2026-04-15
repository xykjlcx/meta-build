package com.metabuild.platform.notification.web;

import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.web.pagination.PageRequestDto;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.notification.api.cmd.NotificationCreateCmd;
import com.metabuild.platform.notification.api.vo.NotificationVo;
import com.metabuild.platform.notification.domain.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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
    private final PaginationPolicy paginationPolicy;

    @GetMapping
    @RequirePermission("notification:notification:list")
    public PageResult<NotificationVo> list(@ParameterObject PageRequestDto request) {
        return notificationService.list(paginationPolicy.normalize(request));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("notification:notification:create")
    public Long create(@Valid @RequestBody NotificationCreateCmd request) {
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
