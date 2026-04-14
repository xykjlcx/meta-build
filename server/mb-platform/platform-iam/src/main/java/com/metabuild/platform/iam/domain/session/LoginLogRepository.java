package com.metabuild.platform.iam.domain.session;

import com.metabuild.schema.tables.records.MbIamLoginLogRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import static com.metabuild.schema.tables.MbIamLoginLog.MB_IAM_LOGIN_LOG;

/**
 * 登录日志数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class LoginLogRepository {

    private final DSLContext dsl;

    /**
     * 插入一条登录日志记录。
     */
    public void insert(MbIamLoginLogRecord record) {
        dsl.insertInto(MB_IAM_LOGIN_LOG).set(record).execute();
    }
}
