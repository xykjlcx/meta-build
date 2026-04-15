package com.metabuild.business.notice.web;

import com.metabuild.business.notice.api.BatchIdsCommand;
import com.metabuild.business.notice.api.BatchResultView;
import com.metabuild.business.notice.api.NoticeCreateCommand;
import com.metabuild.business.notice.api.NoticeDetailView;
import com.metabuild.business.notice.api.NoticePublishCommand;
import com.metabuild.business.notice.api.NoticeQuery;
import com.metabuild.business.notice.api.NoticeUpdateCommand;
import com.metabuild.business.notice.api.NoticeView;
import com.metabuild.business.notice.api.RecipientView;
import com.metabuild.business.notice.domain.NoticeExportService;
import com.metabuild.business.notice.domain.NoticeService;
import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.log.OperationLog;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.metabuild.infra.security.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springdoc.core.annotations.ParameterObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 公告管理 Controller。
 */
@Slf4j
@Tag(name = "公告管理", description = "通知公告的 CRUD 操作")
@RestController
@RequestMapping("/api/v1/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;
    private final NoticeExportService noticeExportService;
    private final CurrentUser currentUser;
    private final PaginationPolicy paginationPolicy;

    // ------ 导出限流（内存级，单实例适用）------

    /** 全局并发导出计数器，上限 3 */
    private static final int EXPORT_CONCURRENT_MAX = 3;
    /** 单用户导出间隔下限（毫秒），1 分钟 */
    private static final long EXPORT_USER_INTERVAL_MS = 60_000L;

    /** key=userId, value=上次导出完成时间戳（毫秒） */
    private final ConcurrentHashMap<Long, Long> userLastExportTime = new ConcurrentHashMap<>();
    /** 全局并发计数 */
    private final AtomicInteger exportConcurrentCount = new AtomicInteger(0);

    @Operation(summary = "分页查询公告列表")
    @GetMapping
    @RequirePermission("notice:notice:list")
    public PageResult<NoticeView> list(@ParameterObject NoticeListRequestDto request) {
        var query = new NoticeQuery(
            request.getStatus(),
            request.getKeyword(),
            request.getStartTimeFrom(),
            request.getStartTimeTo()
        );
        return noticeService.list(query, paginationPolicy.normalize(request));
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
    @OperationLog(module = "notice", operation = "编辑公告")
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

    @Operation(summary = "标记已读（登录用户均可调用，幂等）")
    @PutMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@Parameter(description = "公告 ID") @PathVariable Long id) {
        noticeService.markRead(id);
    }

    @Operation(summary = "查询当前用户未读公告数量（登录用户均可调用）")
    @GetMapping("/unread-count")
    public Map<String, Integer> unreadCount() {
        return Map.of("count", noticeService.unreadCount());
    }

    @Operation(summary = "查询公告接收人列表（分页）")
    @GetMapping("/{id}/recipients")
    @RequirePermission("notice:notice:detail")
    public PageResult<RecipientView> recipients(
        @Parameter(description = "公告 ID") @PathVariable Long id,
        @ParameterObject NoticeRecipientsRequestDto request
    ) {
        return noticeService.recipients(
            id,
            normalizeReadStatus(request.getReadStatus()),
            paginationPolicy.normalize(request)
        );
    }

    @Operation(summary = "导出公告列表（Excel）")
    @GetMapping("/export")
    @RequirePermission("notice:notice:export")
    @OperationLog(module = "notice", operation = "导出公告")
    public void export(
        @Parameter(description = "状态筛选：0=草稿 1=已发布 2=已撤回") @RequestParam(required = false) Short status,
        @Parameter(description = "标题关键词") @RequestParam(required = false) String keyword,
        @Parameter(description = "生效开始时间起") @RequestParam(required = false) OffsetDateTime startTimeFrom,
        @Parameter(description = "生效开始时间止") @RequestParam(required = false) OffsetDateTime startTimeTo,
        HttpServletResponse response
    ) throws IOException {
        Long userId = currentUser.userId();

        // 单用户限流：1 次/分钟
        long now = System.currentTimeMillis();
        Long lastTime = userLastExportTime.get(userId);
        if (lastTime != null && now - lastTime < EXPORT_USER_INTERVAL_MS) {
            long waitSec = (EXPORT_USER_INTERVAL_MS - (now - lastTime)) / 1000 + 1;
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"error\":\"导出过于频繁，请 " + waitSec + " 秒后重试\",\"status\":429}");
            return;
        }

        // 全局并发限流：最多 3 个导出同时进行
        if (exportConcurrentCount.get() >= EXPORT_CONCURRENT_MAX) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"error\":\"当前导出任务已达上限，请稍后重试\",\"status\":429}");
            return;
        }

        // CAS 加计数，防止并发窗口超限
        int current = exportConcurrentCount.incrementAndGet();
        if (current > EXPORT_CONCURRENT_MAX) {
            exportConcurrentCount.decrementAndGet();
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"error\":\"当前导出任务已达上限，请稍后重试\",\"status\":429}");
            return;
        }

        try {
            // 记录本次导出开始时间（占位防止重复提交）
            userLastExportTime.put(userId, now);

            response.setContentType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment;filename=notices.xlsx");

            var query = new NoticeQuery(status, keyword, startTimeFrom, startTimeTo);
            noticeExportService.export(query, response.getOutputStream());
        } finally {
            exportConcurrentCount.decrementAndGet();
        }
    }

    private String normalizeReadStatus(String readStatus) {
        return readStatus == null || readStatus.isBlank() ? "all" : readStatus;
    }
}
