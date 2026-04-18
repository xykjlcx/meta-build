package com.metabuild.business.notice.domain.notice;

import com.metabuild.business.notice.api.cmd.BatchIdsCmd;
import com.metabuild.business.notice.api.vo.BatchResultVo;
import com.metabuild.business.notice.api.cmd.NoticeCreateCmd;
import com.metabuild.business.notice.api.vo.NoticeDetailVo;
import com.metabuild.business.notice.api.NoticeErrorCodes;
import com.metabuild.business.notice.api.cmd.NoticePublishCmd;
import com.metabuild.business.notice.api.qry.NoticeQry;
import com.metabuild.business.notice.api.NoticeTarget;
import com.metabuild.business.notice.api.cmd.NoticeUpdateCmd;
import com.metabuild.business.notice.api.vo.NoticeVo;
import com.metabuild.business.notice.api.vo.RecipientVo;
import com.metabuild.business.notice.domain.event.NoticePublishedEvent;
import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.CommonErrorCodes;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
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
    private final Clock clock;
    /** 自代理，用于在 batch 方法中调用带 REQUIRES_NEW 的 publishOne/deleteOne，避免 Spring 自调用绕过 AOP */
    private final ObjectProvider<NoticeService> selfProvider;

    /**
     * 分页查询公告列表。
     */
    public PageResult<NoticeVo> list(NoticeQry query, PageQuery pageQuery) {
        return noticeRepository.findPage(query, pageQuery, currentUser.userId());
    }

    /**
     * 查询公告详情。
     */
    public NoticeDetailVo detail(Long id) {
        return noticeRepository.findById(id, currentUser.userId())
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));
    }

    /**
     * 创建公告（草稿状态）。
     */
    @Transactional
    public NoticeDetailVo create(NoticeCreateCmd cmd) {
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
    public NoticeDetailVo update(Long id, NoticeUpdateCmd cmd) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        // 仅草稿状态允许编辑
        if (existing.status() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException(NoticeErrorCodes.ONLY_DRAFT_CAN_EDIT);
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
            throw new ConflictException(CommonErrorCodes.CONCURRENT_MODIFICATION);
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
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        NoticeStatus status = NoticeStatus.fromCode(existing.status());
        if (status != NoticeStatus.DRAFT && status != NoticeStatus.REVOKED) {
            throw new BusinessException(NoticeErrorCodes.ONLY_DRAFT_OR_REVOKED_CAN_DELETE);
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
    public NoticeDetailVo publish(Long id, NoticePublishCmd cmd) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        if (existing.status() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException(NoticeErrorCodes.ONLY_DRAFT_CAN_PUBLISH);
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
    public NoticeDetailVo revoke(Long id) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        if (existing.status() != (short) NoticeStatus.PUBLISHED.code()) {
            throw new BusinessException(NoticeErrorCodes.ONLY_PUBLISHED_CAN_REVOKE);
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
    public NoticeDetailVo duplicate(Long id) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        NoticeStatus status = NoticeStatus.fromCode(existing.status());
        if (status != NoticeStatus.PUBLISHED && status != NoticeStatus.REVOKED) {
            throw new BusinessException(NoticeErrorCodes.ONLY_PUBLISHED_OR_REVOKED_CAN_DUPLICATE);
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
     * 单条发布（独立事务，从 DB 读已存 targets 展开 → 写 recipients → 更新状态 → 发事件）。
     * <p>
     * 与 {@link #publish(Long, NoticePublishCmd)} 区别：本方法不接收 cmd，
     * 假设 targets 已在编辑阶段保存到 biz_notice_target；专供 batchPublish 循环调用。
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NoticeDetailVo publishOne(Long id) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        if (existing.status() != (short) NoticeStatus.DRAFT.code()) {
            throw new BusinessException(NoticeErrorCodes.ONLY_DRAFT_CAN_PUBLISH);
        }

        // 从 DB 读已保存的 targets，转回 NoticeTarget 用于复用 expandTargets
        List<NoticeTarget> targets = noticeTargetRepository.findByNoticeId(id).stream()
            .map(vo -> new NoticeTarget(vo.targetType(), vo.targetId()))
            .toList();
        List<Long> recipientUserIds = expandTargets(targets);

        // 清理旧接收人（幂等），分批写入新接收人
        noticeRecipientRepository.deleteByNoticeId(id);
        if (!recipientUserIds.isEmpty()) {
            noticeRecipientRepository.batchInsert(id, recipientUserIds);
        }

        noticeRepository.updateStatus(id, (short) NoticeStatus.PUBLISHED.code(), currentUser.userId());

        log.info("发布公告: noticeId={}, 接收人数={}", id, recipientUserIds.size());

        eventPublisher.publishEvent(new NoticePublishedEvent(id, existing.title(), recipientUserIds));

        return detail(id);
    }

    /**
     * 单条删除（独立事务）。
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteOne(Long id) {
        var existing = noticeRepository.findSnapshotById(id)
            .orElseThrow(() -> new NotFoundException(NoticeErrorCodes.NOT_FOUND, id));

        NoticeStatus status = NoticeStatus.fromCode(existing.status());
        if (status != NoticeStatus.DRAFT && status != NoticeStatus.REVOKED) {
            throw new BusinessException(NoticeErrorCodes.ONLY_DRAFT_OR_REVOKED_CAN_DELETE);
        }

        noticeAttachmentRepository.deleteByNoticeId(id);
        noticeTargetRepository.deleteByNoticeId(id);
        noticeRecipientRepository.deleteByNoticeId(id);
        noticeRepository.deleteById(id);
        log.info("删除公告: noticeId={}", id);
    }

    /**
     * 批量发布公告：每条独立事务，逐条执行，失败项进入 failures 不影响其他。
     */
    public BatchResultVo batchPublish(BatchIdsCmd cmd) {
        NoticeService self = selfProvider.getObject();
        int success = 0;
        List<BatchResultVo.FailedItem> failures = new ArrayList<>();

        for (Long id : cmd.ids()) {
            try {
                self.publishOne(id);
                success++;
            } catch (BusinessException e) {
                failures.add(new BatchResultVo.FailedItem(id, e.getCode(), e.getMessage()));
            } catch (Exception e) {
                log.error("批量发布异常 id={}", id, e);
                failures.add(new BatchResultVo.FailedItem(
                    id, NoticeErrorCodes.INTERNAL_ERROR, e.getMessage()
                ));
            }
        }

        log.info("批量发布公告: success={}, failed={}", success, failures.size());
        return new BatchResultVo(success, failures.size(), failures);
    }

    /**
     * 批量删除公告：每条独立事务，失败项进入 failures。
     */
    public BatchResultVo batchDelete(BatchIdsCmd cmd) {
        NoticeService self = selfProvider.getObject();
        int success = 0;
        List<BatchResultVo.FailedItem> failures = new ArrayList<>();

        for (Long id : cmd.ids()) {
            try {
                self.deleteOne(id);
                success++;
            } catch (BusinessException e) {
                failures.add(new BatchResultVo.FailedItem(id, e.getCode(), e.getMessage()));
            } catch (Exception e) {
                log.error("批量删除异常 id={}", id, e);
                failures.add(new BatchResultVo.FailedItem(
                    id, NoticeErrorCodes.INTERNAL_ERROR, e.getMessage()
                ));
            }
        }

        log.info("批量删除公告: success={}, failed={}", success, failures.size());
        return new BatchResultVo(success, failures.size(), failures);
    }

    // ------ 已读/未读 ------

    /**
     * 标记当前登录用户已读（幂等）。
     *
     * @param noticeId 公告 ID
     */
    @Transactional
    public void markRead(Long noticeId) {
        Long userId = currentUser.userId();
        noticeRecipientRepository.markRead(noticeId, userId, OffsetDateTime.now(clock));
    }

    /**
     * 查询当前登录用户的未读公告数量。
     *
     * @return 未读数量
     */
    public int unreadCount() {
        return noticeRecipientRepository.unreadCount(currentUser.userId());
    }

    /**
     * 分页查询公告接收人列表（需要管理权限）。
     *
     * @param noticeId   公告 ID
     * @param readStatus 已读状态筛选：all/read/unread
     * @param page       页码（从 1 开始）
     * @param size       每页条数
     * @return 分页接收人视图
     */
    public PageResult<RecipientVo> recipients(Long noticeId, String readStatus, PageQuery pageQuery) {
        return noticeRecipientRepository.findRecipients(noticeId, readStatus, pageQuery);
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
