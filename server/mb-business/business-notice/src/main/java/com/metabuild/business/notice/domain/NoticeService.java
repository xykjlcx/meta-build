package com.metabuild.business.notice.domain;

import com.metabuild.business.notice.api.BatchIdsCommand;
import com.metabuild.business.notice.api.BatchResultView;
import com.metabuild.business.notice.api.NoticeCreateCommand;
import com.metabuild.business.notice.api.NoticeDetailView;
import com.metabuild.business.notice.api.NoticePublishCommand;
import com.metabuild.business.notice.api.NoticeQuery;
import com.metabuild.business.notice.api.NoticeTarget;
import com.metabuild.business.notice.api.NoticeUpdateCommand;
import com.metabuild.business.notice.api.NoticeView;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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
    private final NoticeTargetRepository noticeTargetRepository;
    private final NoticeRecipientRepository noticeRecipientRepository;
    private final CurrentUser currentUser;
    private final SnowflakeIdGenerator idGenerator;
    private final ApplicationEventPublisher eventPublisher;

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

        noticeRepository.insert(
            noticeId, 0L, cmd.title(), sanitizeHtml(cmd.content()),
            (short) NoticeStatus.DRAFT.code(),
            cmd.pinned() != null ? cmd.pinned() : false,
            cmd.startTime(), cmd.endTime(),
            currentUser.deptId() != null ? currentUser.deptId() : 0L,
            userId
        );

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
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        // 仅草稿状态允许编辑
        if (existing.status() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException("notice.onlyDraftCanEdit", 400);
        }

        int updated = noticeRepository.update(
            id,
            cmd.title(),
            sanitizeHtml(cmd.content()),
            cmd.pinned() != null ? cmd.pinned() : existing.pinned(),
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
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        NoticeStatus status = NoticeStatus.fromCode(existing.status());
        if (status != NoticeStatus.DRAFT && status != NoticeStatus.REVOKED) {
            throw new BusinessException("notice.onlyDraftOrRevokedCanDelete", 400);
        }

        noticeAttachmentRepository.deleteByNoticeId(id);
        noticeTargetRepository.deleteByNoticeId(id);
        noticeRecipientRepository.deleteByNoticeId(id);
        noticeRepository.deleteById(id);
        log.info("删除公告: noticeId={}", id);
    }

    /**
     * 发布公告：DRAFT → PUBLISHED。
     * <p>
     * 完整流程：
     * 1. 校验 DRAFT 状态
     * 2. 写入发送目标（先清后插，幂等）
     * 3. 展开 targets → userIds（去重）
     * 4. 分批写入接收人（每批 500 条）
     * 5. 更新状态为 PUBLISHED
     * 6. 发布 NoticePublishedEvent（事务提交后异步通知）
     */
    @Transactional
    public NoticeDetailView publish(Long id, NoticePublishCommand cmd) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        if (existing.status() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException("notice.onlyDraftCanPublish", 400);
        }

        // 写入发送目标（先清后插，支持重复调用幂等）
        noticeTargetRepository.deleteByNoticeId(id);
        noticeTargetRepository.batchInsert(id, cmd.targets());

        // 展开 targets → userIds（去重）
        List<Long> recipientUserIds = expandTargets(cmd.targets());

        // 清理旧接收人（幂等），分批写入新接收人
        noticeRecipientRepository.deleteByNoticeId(id);
        noticeRecipientRepository.batchInsert(id, recipientUserIds);

        // 更新状态
        noticeRepository.updateStatus(id, (short) NoticeStatus.PUBLISHED.code(), currentUser.userId());

        log.info("发布公告: noticeId={}, 接收人数={}", id, recipientUserIds.size());

        // 发布事件（事务提交后异步处理通知推送）
        eventPublisher.publishEvent(new NoticePublishedEvent(id, existing.title(), recipientUserIds));

        return detail(id);
    }

    /**
     * 撤回公告：PUBLISHED → REVOKED。
     */
    @Transactional
    public NoticeDetailView revoke(Long id) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        if (existing.status() != (short) NoticeStatus.PUBLISHED.code()) {
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
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException("notice.notFound", id));

        NoticeStatus status = NoticeStatus.fromCode(existing.status());
        if (status != NoticeStatus.PUBLISHED && status != NoticeStatus.REVOKED) {
            throw new BusinessException("notice.onlyPublishedOrRevokedCanDuplicate", 400);
        }

        Long userId = currentUser.userId();
        Long newId = idGenerator.nextId();

        // 创建新公告（草稿）
        noticeRepository.insert(
            newId, 0L, existing.title(), existing.content(),
            (short) NoticeStatus.DRAFT.code(), existing.pinned(),
            existing.startTime(), existing.endTime(),
            currentUser.deptId() != null ? currentUser.deptId() : 0L,
            userId
        );

        // 复制附件关联和发送目标
        noticeRepository.copyAttachments(id, newId, userId);
        noticeTargetRepository.copyTargets(id, newId);

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
            var opt = noticeRepository.findSnapshotById(id);
            if (opt.isEmpty() || opt.get().status() != (short) NoticeStatus.DRAFT.code()) {
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
            var opt = noticeRepository.findSnapshotById(id);
            if (opt.isEmpty()) {
                skipped++;
                continue;
            }
            NoticeStatus status = NoticeStatus.fromCode(opt.get().status());
            if (status != NoticeStatus.DRAFT && status != NoticeStatus.REVOKED) {
                skipped++;
                continue;
            }
            noticeAttachmentRepository.deleteByNoticeId(id);
            noticeTargetRepository.deleteByNoticeId(id);
            noticeRecipientRepository.deleteByNoticeId(id);
            noticeRepository.deleteById(id);
            success++;
        }

        log.info("批量删除公告: success={}, skipped={}", success, skipped);
        return new BatchResultView(success, skipped);
    }

    // ------ 私有方法 ------

    /**
     * 展开发送目标到具体用户 ID 列表（去重）。
     * <p>
     * ALL → 全部启用用户；DEPT → 该部门下启用用户；
     * ROLE → 拥有该角色的启用用户；USER → 直接使用 targetId。
     */
    private List<Long> expandTargets(List<NoticeTarget> targets) {
        Set<Long> userIds = new LinkedHashSet<>();

        for (var target : targets) {
            switch (target.targetType()) {
                case "ALL" -> userIds.addAll(noticeRecipientRepository.findAllActiveUserIds());
                case "DEPT" -> {
                    if (target.targetId() != null) {
                        userIds.addAll(noticeRecipientRepository.findUserIdsByDeptId(target.targetId()));
                    }
                }
                case "ROLE" -> {
                    if (target.targetId() != null) {
                        userIds.addAll(noticeRecipientRepository.findUserIdsByRoleId(target.targetId()));
                    }
                }
                case "USER" -> {
                    if (target.targetId() != null) {
                        userIds.add(target.targetId());
                    }
                }
                default -> log.warn("未知的目标类型: {}", target.targetType());
            }
        }

        return new ArrayList<>(userIds);
    }

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
