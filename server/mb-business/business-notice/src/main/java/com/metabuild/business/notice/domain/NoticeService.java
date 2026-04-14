package com.metabuild.business.notice.domain;

import com.metabuild.business.notice.api.BatchIdsCommand;
import com.metabuild.business.notice.api.BatchResultView;
import com.metabuild.business.notice.api.NoticeCreateCommand;
import com.metabuild.business.notice.api.NoticeDetailView;
import com.metabuild.business.notice.api.NoticePublishCommand;
import com.metabuild.business.notice.api.NoticeQuery;
import com.metabuild.business.notice.api.NoticeUpdateCommand;
import com.metabuild.business.notice.api.NoticeView;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.schema.tables.records.BizNoticeRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 公告领域服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository noticeAttachmentRepository;
    private final CurrentUser currentUser;
    private final SnowflakeIdGenerator idGenerator;

    /**
     * 分页查询公告列表。
     */
    public PageResult<NoticeView> list(NoticeQuery query) {
        return noticeRepository.findPage(query, currentUser.userId());
    }

    /**
     * 查询公告详情。
     */
    public NoticeDetailView detail(Long id) {
        return noticeRepository.findById(id, currentUser.userId())
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));
    }

    /**
     * 创建公告（草稿状态）。
     */
    @Transactional
    public NoticeDetailView create(NoticeCreateCommand cmd) {
        Long userId = currentUser.userId();
        Long noticeId = idGenerator.nextId();

        var record = new BizNoticeRecord();
        record.setId(noticeId);
        record.setTenantId(0L);
        record.setTitle(cmd.title());
        record.setContent(sanitizeHtml(cmd.content()));
        record.setStatus((short) NoticeStatus.DRAFT.code());
        record.setPinned(cmd.pinned() != null ? cmd.pinned() : false);
        record.setStartTime(cmd.startTime());
        record.setEndTime(cmd.endTime());
        record.setOwnerDeptId(currentUser.deptId() != null ? currentUser.deptId() : 0L);
        record.setVersion(0);
        record.setCreatedBy(userId);
        record.setUpdatedBy(userId);

        noticeRepository.insert(record);

        // 批量插入附件关联（按 fileIds 顺序设 sortOrder）
        List<Long> fileIds = cmd.attachmentFileIds();
        if (fileIds != null && !fileIds.isEmpty()) {
            noticeAttachmentRepository.batchInsert(noticeId, fileIds, userId, 0L);
        }

        log.info("创建公告: noticeId={}, title={}", noticeId, cmd.title());
        return detail(noticeId);
    }

    /**
     * 更新公告（仅草稿状态允许编辑）。
     */
    @Transactional
    public NoticeDetailView update(Long id, NoticeUpdateCommand cmd) {
        var existing = noticeRepository.findRecordById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        // 仅草稿状态允许编辑
        if (existing.getStatus() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException("notice.onlyDraftCanEdit", 400);
        }

        int updated = noticeRepository.update(
            id,
            cmd.title(),
            sanitizeHtml(cmd.content()),
            cmd.pinned() != null ? cmd.pinned() : existing.getPinned(),
            cmd.startTime(),
            cmd.endTime(),
            cmd.version(),
            currentUser.userIdOrSystem()
        );

        if (updated == 0) {
            throw new ConflictException("common.concurrentModification");
        }

        // 附件关联：全量替换（先删后插）
        noticeAttachmentRepository.deleteByNoticeId(id);
        List<Long> fileIds = cmd.attachmentFileIds();
        if (fileIds != null && !fileIds.isEmpty()) {
            noticeAttachmentRepository.batchInsert(id, fileIds, currentUser.userIdOrSystem(), 0L);
        }

        log.info("更新公告: noticeId={}", id);
        return detail(id);
    }

    /**
     * 删除公告（仅草稿或已撤回状态允许删除）。
     */
    @Transactional
    public void delete(Long id) {
        var existing = noticeRepository.findRecordById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        NoticeStatus status = NoticeStatus.fromCode(existing.getStatus());
        if (status != NoticeStatus.DRAFT && status != NoticeStatus.REVOKED) {
            throw new BusinessException("notice.onlyDraftOrRevokedCanDelete", 400);
        }

        noticeRepository.deleteAttachments(id);
        noticeRepository.deleteTargets(id);
        noticeRepository.deleteById(id);
        log.info("删除公告: noticeId={}", id);
    }

    /**
     * 发布公告：DRAFT → PUBLISHED。
     * <p>
     * 仅做状态变更 + 写入发送目标，接收人展开由 Task 9 实现。
     */
    @Transactional
    public NoticeDetailView publish(Long id, NoticePublishCommand cmd) {
        var existing = noticeRepository.findRecordById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        if (existing.getStatus() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException("notice.onlyDraftCanPublish", 400);
        }

        // 写入发送目标（先清后插，支持重复调用幂等）
        noticeRepository.deleteTargets(id);
        noticeRepository.insertTargets(id, cmd.targets());

        noticeRepository.updateStatus(id, (short) NoticeStatus.PUBLISHED.code(), currentUser.userId());
        log.info("发布公告: noticeId={}", id);
        return detail(id);
    }

    /**
     * 撤回公告：PUBLISHED → REVOKED。
     */
    @Transactional
    public NoticeDetailView revoke(Long id) {
        var existing = noticeRepository.findRecordById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        if (existing.getStatus() != (short) NoticeStatus.PUBLISHED.code()) {
            throw new BusinessException("notice.onlyPublishedCanRevoke", 400);
        }

        noticeRepository.updateStatus(id, (short) NoticeStatus.REVOKED.code(), currentUser.userId());
        log.info("撤回公告: noticeId={}", id);
        return detail(id);
    }

    /**
     * 复制公告：基于已发布或已撤回的公告创建新草稿。
     * <p>
     * 复制字段：title / content / pinned / startTime / endTime + 附件关联 + 发送目标。
     */
    @Transactional
    public NoticeDetailView duplicate(Long id) {
        var existing = noticeRepository.findRecordById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        NoticeStatus status = NoticeStatus.fromCode(existing.getStatus());
        if (status != NoticeStatus.PUBLISHED && status != NoticeStatus.REVOKED) {
            throw new BusinessException("notice.onlyPublishedOrRevokedCanDuplicate", 400);
        }

        Long userId = currentUser.userId();
        Long newId = idGenerator.nextId();

        // 创建新公告（草稿）
        var record = new BizNoticeRecord();
        record.setId(newId);
        record.setTenantId(0L);
        record.setTitle(existing.getTitle());
        record.setContent(existing.getContent());
        record.setStatus((short) NoticeStatus.DRAFT.code());
        record.setPinned(existing.getPinned());
        record.setStartTime(existing.getStartTime());
        record.setEndTime(existing.getEndTime());
        record.setOwnerDeptId(currentUser.deptId() != null ? currentUser.deptId() : 0L);
        record.setVersion(0);
        record.setCreatedBy(userId);
        record.setUpdatedBy(userId);

        noticeRepository.insert(record);

        // 复制附件关联和发送目标
        noticeRepository.copyAttachments(id, newId, userId);
        noticeRepository.copyTargets(id, newId);

        log.info("复制公告: sourceId={}, newId={}", id, newId);
        return detail(newId);
    }

    /**
     * 批量发布公告。
     * <p>
     * 逐条校验，符合条件（DRAFT）的执行发布（简化版，无接收人展开），不符合的跳过。
     */
    @Transactional
    public BatchResultView batchPublish(BatchIdsCommand cmd) {
        int success = 0;
        int skipped = 0;

        for (Long id : cmd.ids()) {
            var opt = noticeRepository.findRecordById(id);
            if (opt.isEmpty() || opt.get().getStatus() != (short) NoticeStatus.DRAFT.code()) {
                skipped++;
                continue;
            }
            noticeRepository.updateStatus(id, (short) NoticeStatus.PUBLISHED.code(), currentUser.userId());
            success++;
        }

        log.info("批量发布公告: success={}, skipped={}", success, skipped);
        return new BatchResultView(success, skipped);
    }

    /**
     * 批量删除公告。
     * <p>
     * 逐条校验，符合条件（DRAFT 或 REVOKED）的执行删除，不符合的跳过。
     */
    @Transactional
    public BatchResultView batchDelete(BatchIdsCommand cmd) {
        int success = 0;
        int skipped = 0;

        for (Long id : cmd.ids()) {
            var opt = noticeRepository.findRecordById(id);
            if (opt.isEmpty()) {
                skipped++;
                continue;
            }
            NoticeStatus status = NoticeStatus.fromCode(opt.get().getStatus());
            if (status != NoticeStatus.DRAFT && status != NoticeStatus.REVOKED) {
                skipped++;
                continue;
            }
            noticeRepository.deleteAttachments(id);
            noticeRepository.deleteTargets(id);
            noticeRepository.deleteById(id);
            success++;
        }

        log.info("批量删除公告: success={}, skipped={}", success, skipped);
        return new BatchResultView(success, skipped);
    }

    // ------ 私有方法 ------

    /**
     * HTML 内容净化（基于 jsoup Safelist.relaxed() 扩展）。
     * <p>
     * relaxed 白名单允许：a, b, blockquote, br, caption, cite, code, col, colgroup,
     * dd, div, dl, dt, em, h1-h6, i, img, li, ol, p, pre, q, small, span,
     * strike, strong, sub, sup, table, tbody, td, tfoot, th, thead, tr, u, ul。
     * <p>
     * 扩展：允许 img 的 style 属性（富文本编辑器常用于图片尺寸）。
     */
    private String sanitizeHtml(String html) {
        if (html == null || html.isBlank()) {
            return html;
        }
        Safelist safelist = Safelist.relaxed()
            .addAttributes("img", "style")
            .addAttributes("span", "style")
            .addAttributes("p", "style")
            .addAttributes("div", "style");
        return Jsoup.clean(html, safelist);
    }
}
