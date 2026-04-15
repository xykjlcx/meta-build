package com.metabuild.platform.iam.domain.user;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.query.SortParser;
import com.metabuild.schema.tables.records.MbIamUserRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 用户数据访问层（仅 jOOQ，严禁出现 Service 逻辑）。
 */
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;
    private final Clock clock;

    public Optional<MbIamUserRecord> findById(Long id) {
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.ID.eq(id))
            .fetchOptional();
    }

    public Optional<MbIamUserRecord> findByUsername(String username) {
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.USERNAME.eq(username))
            .fetchOptional();
    }

    public boolean existsByUsername(String username) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_USER).where(MB_IAM_USER.USERNAME.eq(username))
        );
    }

    public PageResult<MbIamUserRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_IAM_USER)
            .allow("username", MB_IAM_USER.USERNAME)
            .allow("email", MB_IAM_USER.EMAIL)
            .defaultSort(MB_IAM_USER.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_IAM_USER);
        List<MbIamUserRecord> records = dsl.selectFrom(MB_IAM_USER)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    public Long insert(MbIamUserRecord record) {
        dsl.insertInto(MB_IAM_USER).set(record).execute();
        return record.getId();
    }

    /**
     * 乐观锁更新用户。
     * Repository 层负责 version + 1 和 updated_at（DSL UPDATE 不走 AuditFieldsRecordListener）。
     * Service 层传入 updatedBy。
     */
    public int update(MbIamUserRecord record, Long updatedBy) {
        return dsl.update(MB_IAM_USER)
            .set(MB_IAM_USER.EMAIL, record.getEmail())
            .set(MB_IAM_USER.PHONE, record.getPhone())
            .set(MB_IAM_USER.NICKNAME, record.getNickname())
            .set(MB_IAM_USER.AVATAR, record.getAvatar())
            .set(MB_IAM_USER.DEPT_ID, record.getDeptId())
            .set(MB_IAM_USER.OWNER_DEPT_ID, record.getOwnerDeptId())
            .set(MB_IAM_USER.STATUS, record.getStatus())
            .set(MB_IAM_USER.PASSWORD_HASH, record.getPasswordHash())
            .set(MB_IAM_USER.PASSWORD_UPDATED_AT, record.getPasswordUpdatedAt())
            .set(MB_IAM_USER.MUST_CHANGE_PASSWORD, record.getMustChangePassword())
            .set(MB_IAM_USER.VERSION, MB_IAM_USER.VERSION.plus(1))
            .set(MB_IAM_USER.UPDATED_BY, updatedBy)
            .set(MB_IAM_USER.UPDATED_AT, OffsetDateTime.now(clock))
            .where(MB_IAM_USER.ID.eq(record.getId()))
            .and(MB_IAM_USER.VERSION.eq(record.getVersion()))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_USER).where(MB_IAM_USER.ID.eq(id)).execute();
    }
}
