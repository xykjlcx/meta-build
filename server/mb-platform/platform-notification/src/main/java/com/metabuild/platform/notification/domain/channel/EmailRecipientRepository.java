package com.metabuild.platform.notification.domain.channel;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 邮件接收人查询 Repository（查询 mb_iam_user 表的邮箱信息）。
 *
 * <p>独立 Repository 以满足 ArchUnit 规则：DSLContext 只允许在 Repository 中使用。
 */
@Repository
@RequiredArgsConstructor
public class EmailRecipientRepository {

    private final DSLContext dsl;

    /**
     * 按用户 ID 列表查询有邮箱的用户。
     *
     * @param userIds 用户 ID 列表
     * @return userId → email 映射（无邮箱的用户不在结果中）
     */
    public Map<Long, String> findEmailsByUserIds(List<Long> userIds) {
        return dsl.select(MB_IAM_USER.ID, MB_IAM_USER.EMAIL)
                .from(MB_IAM_USER)
                .where(MB_IAM_USER.ID.in(userIds))
                .and(MB_IAM_USER.EMAIL.isNotNull())
                .and(MB_IAM_USER.EMAIL.ne(""))
                .fetchMap(MB_IAM_USER.ID, MB_IAM_USER.EMAIL);
    }
}
