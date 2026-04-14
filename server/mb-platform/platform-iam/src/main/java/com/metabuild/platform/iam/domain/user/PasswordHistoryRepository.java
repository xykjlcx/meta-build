package com.metabuild.platform.iam.domain.user;

import com.metabuild.schema.tables.records.MbIamPasswordHistoryRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.MbIamPasswordHistory.MB_IAM_PASSWORD_HISTORY;

/**
 * 密码历史数据访问层（防重用校验）。
 */
@Repository
@RequiredArgsConstructor
public class PasswordHistoryRepository {

    private final DSLContext dsl;

    /**
     * 查询用户最近 N 条密码哈希（按创建时间倒序）。
     */
    public List<String> findRecentHashes(Long userId, int limit) {
        return dsl.select(MB_IAM_PASSWORD_HISTORY.PASSWORD_HASH)
            .from(MB_IAM_PASSWORD_HISTORY)
            .where(MB_IAM_PASSWORD_HISTORY.USER_ID.eq(userId))
            .orderBy(MB_IAM_PASSWORD_HISTORY.CREATED_AT.desc())
            .limit(limit)
            .fetchInto(String.class);
    }

    /**
     * 插入一条密码历史记录。
     */
    public void insert(MbIamPasswordHistoryRecord record) {
        dsl.insertInto(MB_IAM_PASSWORD_HISTORY).set(record).execute();
    }
}
