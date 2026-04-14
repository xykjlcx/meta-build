package com.metabuild.platform.iam.domain.user;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbIamUserRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

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

    public int update(MbIamUserRecord record) {
        return dsl.update(MB_IAM_USER)
            .set(record)
            .where(MB_IAM_USER.ID.eq(record.getId()))
            .and(MB_IAM_USER.VERSION.eq(record.getVersion() - 1))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_USER).where(MB_IAM_USER.ID.eq(id)).execute();
    }
}
