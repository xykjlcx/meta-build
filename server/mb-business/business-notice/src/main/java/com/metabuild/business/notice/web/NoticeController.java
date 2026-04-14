package com.metabuild.business.notice.web;

import com.metabuild.business.notice.api.BatchIdsCommand;
import com.metabuild.business.notice.api.BatchResultView;
import com.metabuild.business.notice.api.NoticeCreateCommand;
import com.metabuild.business.notice.api.NoticeDetailView;
import com.metabuild.business.notice.api.NoticePublishCommand;
import com.metabuild.business.notice.api.NoticeQuery;
import com.metabuild.business.notice.api.NoticeUpdateCommand;
import com.metabuild.business.notice.api.NoticeView;
import com.metabuild.business.notice.domain.NoticeService;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.log.OperationLog;
import com.metabuild.infra.security.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 公告管理 Controller。
 */
@Tag(name = "公告管理", description = "通知公告的 CRUD 操作")
@RestController
@RequestMapping("/api/v1/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @Operation(summary = "分页查询公告列表")
    @GetMapping
    @RequirePermission("notice:notice:list")
    public PageResult<NoticeView> list(
        @Parameter(description = "状态筛选：0=草稿 1=已发布 2=已撤回") @RequestParam(required = false) Short status,
        @Parameter(description = "标题关键词") @RequestParam(required = false) String keyword,
        @Parameter(description = "生效开始时间起") @RequestParam(required = false) OffsetDateTime startTimeFrom,
        @Parameter(description = "生效开始时间止") @RequestParam(required = false) OffsetDateTime startTimeTo,
        @Parameter(description = "页码（从 1 开始）") @RequestParam(defaultValue = "1") int page,
        @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") int size,
        @Parameter(description = "排序（如 createdAt,desc）") @RequestParam(required = false) List<String> sort
    ) {
        var query = new NoticeQuery(status, keyword, startTimeFrom, startTimeTo, page, size, sort);
        return noticeService.list(query);
    }

    @Operation(summary = "查询公告详情")
    @GetMapping("/{id}")
    @RequirePermission("notice:notice:detail")
    public NoticeDetailView detail(@Parameter(description = "公告 ID") @PathVariable Long id) {
        return noticeService.detail(id);
    }

    @Operation(summary = "创建公告")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("notice:notice:create")
    @OperationLog(module = "notice", operation = "创建公告")
    public NoticeDetailView create(@Valid @RequestBody NoticeCreateCommand cmd) {
        return noticeService.create(cmd);
    }

    @Operation(summary = "更新公告")
    @PutMapping("/{id}")
    @RequirePermission("notice:notice:update")
    @OperationLog(module = "notice", operation = "更新公告")
    public NoticeDetailView update(
        @Parameter(description = "公告 ID") @PathVariable Long id,
        @Valid @RequestBody NoticeUpdateCommand cmd
    ) {
        return noticeService.update(id, cmd);
    }

    @Operation(summary = "删除公告")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("notice:notice:delete")
    @OperationLog(module = "notice", operation = "删除公告")
    public void delete(@Parameter(description = "公告 ID") @PathVariable Long id) {
        noticeService.delete(id);
    }

    @Operation(summary = "发布公告")
    @PostMapping("/{id}/publish")
    @RequirePermission("notice:notice:publish")
    @OperationLog(module = "notice", operation = "发布公告")
    public NoticeDetailView publish(
        @Parameter(description = "公告 ID") @PathVariable Long id,
        @Valid @RequestBody NoticePublishCommand cmd
    ) {
        return noticeService.publish(id, cmd);
    }

    @Operation(summary = "撤回公告")
    @PostMapping("/{id}/revoke")
    @RequirePermission("notice:notice:publish")
    @OperationLog(module = "notice", operation = "撤回公告")
    public NoticeDetailView revoke(@Parameter(description = "公告 ID") @PathVariable Long id) {
        return noticeService.revoke(id);
    }

    @Operation(summary = "复制公告")
    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("notice:notice:create")
    @OperationLog(module = "notice", operation = "复制公告")
    public NoticeDetailView duplicate(@Parameter(description = "公告 ID") @PathVariable Long id) {
        return noticeService.duplicate(id);
    }

    @Operation(summary = "批量发布公告")
    @PostMapping("/batch-publish")
    @RequirePermission("notice:notice:publish")
    @OperationLog(module = "notice", operation = "批量发布公告")
    public BatchResultView batchPublish(@Valid @RequestBody BatchIdsCommand cmd) {
        return noticeService.batchPublish(cmd);
    }

    @Operation(summary = "批量删除公告")
    @DeleteMapping("/batch")
    @RequirePermission("notice:notice:delete")
    @OperationLog(module = "notice", operation = "批量删除公告")
    public BatchResultView batchDelete(@Valid @RequestBody BatchIdsCommand cmd) {
        return noticeService.batchDelete(cmd);
    }
}
