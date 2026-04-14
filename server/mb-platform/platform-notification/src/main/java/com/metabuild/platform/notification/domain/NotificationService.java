package com.metabuild.platform.notification.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.notification.api.dto.NotificationCreateRequest;
import com.metabuild.platform.notification.api.dto.NotificationResponse;
import com.metabuild.schema.tables.records.MbNotificationReadRecord;
import com.metabuild.schema.tables.records.MbNotificationRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * 通知公告业务服务（创建/列表/标记已读）。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository repository;
    private final NotificationReadRepository readRepository;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;
    private final Clock clock;

    /**
     * 分页查询通知列表（携带当前用户已读状态）。
     */
    public PageResult<NotificationResponse> list(PageQuery query) {
        Long userId = currentUser.isAuthenticated() ? currentUser.userId() : null;
        Set<Long> readIds = userId != null ? readRepository.findReadIds(userId) : Set.of();

        return repository.findPage(query).map(n ->
            toResponse(n, readIds.contains(n.getId()))
        );
    }

    /**
     * 创建通知。
     */
    @Transactional
    public Long create(NotificationCreateRequest req) {
        MbNotificationRecord record = new MbNotificationRecord();
        record.setId(idGenerator.nextId());
        record.setTenantId(0L);
        record.setTitle(req.title());
        record.setContent(req.content());
        record.setType(req.type() != null ? req.type() : "SYSTEM");
        record.setSenderId(currentUser.isAuthenticated() ? currentUser.userId() : null);
        record.setStatus((short) 1);
        record.setOwnerDeptId(0L);
        record.setVersion(0);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setCreatedAt(OffsetDateTime.now(clock));
        record.setUpdatedAt(OffsetDateTime.now(clock));
        repository.insert(record);
        return record.getId();
    }

    /**
     * 标记通知为已读。
     */
    @Transactional
    public void markRead(Long notificationId) {
        // 确认通知存在
        repository.findById(notificationId)
            .orElseThrow(() -> new NoSuchElementException("通知不存在: " + notificationId));

        Long userId = currentUser.userId();
        MbNotificationReadRecord readRecord = new MbNotificationReadRecord();
        readRecord.setNotificationId(notificationId);
        readRecord.setUserId(userId);
        readRecord.setReadAt(OffsetDateTime.now(clock));
        readRepository.insert(readRecord);
    }

    /**
     * 删除通知（仅管理员）。
     */
    @Transactional
    public void delete(Long id) {
        repository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("通知不存在: " + id));
        repository.deleteById(id);
    }

    private NotificationResponse toResponse(MbNotificationRecord r, boolean read) {
        return new NotificationResponse(
            r.getId(), r.getTitle(), r.getContent(), r.getType(),
            r.getStatus(), r.getSenderId(), read, r.getCreatedAt()
        );
    }
}
