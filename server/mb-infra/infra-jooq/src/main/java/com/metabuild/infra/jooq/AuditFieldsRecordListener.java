package com.metabuild.infra.jooq;

import com.metabuild.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.RecordContext;
import org.jooq.impl.DefaultRecordListener;
import org.springframework.beans.factory.ObjectProvider;

import java.time.Clock;
import java.time.LocalDateTime;

/**
 * 审计字段自动填充监听器：
 * <ul>
 *   <li>INSERT 时自动填充 created_by / created_at / updated_by / updated_at</li>
 *   <li>UPDATE 时自动填充 updated_by / updated_at</li>
 * </ul>
 *
 * <p>字段不存在时静默跳过，兼容没有审计字段的表。
 * 时间通过注入的 {@link Clock} Bean 获取，便于测试中固定时间。
 * 用户信息通过 {@link CurrentUser} 获取，系统级操作（未认证）使用 0L 作为操作人。
 */
@Slf4j
@RequiredArgsConstructor
public class AuditFieldsRecordListener extends DefaultRecordListener {

    /** 系统级操作的占位用户 ID */
    private static final long SYSTEM_USER_ID = 0L;

    private final ObjectProvider<CurrentUser> currentUserProvider;
    private final ObjectProvider<Clock> clockProvider;

    @Override
    public void insertStart(RecordContext ctx) {
        LocalDateTime now = now();
        Long userId = currentUserId();

        setFieldIfExists(ctx, "created_by", userId);
        setFieldIfExists(ctx, "created_at", now);
        setFieldIfExists(ctx, "updated_by", userId);
        setFieldIfExists(ctx, "updated_at", now);
    }

    @Override
    public void updateStart(RecordContext ctx) {
        LocalDateTime now = now();
        Long userId = currentUserId();

        setFieldIfExists(ctx, "updated_by", userId);
        setFieldIfExists(ctx, "updated_at", now);
    }

    // ---- 私有方法 ----

    /**
     * 如果 Record 中存在指定字段，则设置值；字段不存在时静默跳过。
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void setFieldIfExists(RecordContext ctx, String fieldName, Object value) {
        org.jooq.Record record = ctx.record();
        if (record == null) return;

        org.jooq.Field field = record.field(fieldName);
        if (field != null) {
            try {
                record.set(field, value);
            } catch (Exception e) {
                log.debug("审计字段 [{}] 设置失败，跳过: {}", fieldName, e.getMessage());
            }
        }
    }

    /**
     * 获取当前登录用户 ID，未认证时返回系统占位 ID。
     */
    private Long currentUserId() {
        try {
            CurrentUser user = currentUserProvider.getIfAvailable();
            if (user != null && user.isAuthenticated()) {
                return user.userId();
            }
        } catch (Exception e) {
            log.debug("审计字段：获取 CurrentUser 失败，使用系统用户 ID", e);
        }
        return SYSTEM_USER_ID;
    }

    /**
     * 获取当前时间，Clock Bean 不存在时降级为系统时间。
     */
    private LocalDateTime now() {
        try {
            Clock clock = clockProvider.getIfAvailable();
            if (clock != null) {
                return LocalDateTime.now(clock);
            }
        } catch (Exception e) {
            log.debug("审计字段：获取 Clock Bean 失败，使用系统时间", e);
        }
        return LocalDateTime.now();
    }
}
