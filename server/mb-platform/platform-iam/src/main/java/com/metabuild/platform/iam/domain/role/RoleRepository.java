package com.metabuild.platform.iam.domain.role;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.SortParser;
import com.metabuild.schema.tables.records.MbIamRoleRecord;
import com.metabuild.schema.tables.records.MbIamUserRoleRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamRole.MB_IAM_ROLE;
import static com.metabuild.schema.tables.MbIamUserRole.MB_IAM_USER_ROLE;

/**
 * 角色数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class RoleRepository {

    private final DSLContext dsl;

    public Optional<MbIamRoleRecord> findById(Long id) {
        return dsl.selectFrom(MB_IAM_ROLE)
            .where(MB_IAM_ROLE.ID.eq(id))
            .fetchOptional();
    }

    public boolean existsByCode(String code) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_ROLE).where(MB_IAM_ROLE.CODE.eq(code))
        );
    }

    public PageResult<MbIamRoleRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_IAM_ROLE)
            .allow("name", MB_IAM_ROLE.NAME)
            .allow("code", MB_IAM_ROLE.CODE)
            .defaultSort(MB_IAM_ROLE.SORT_ORDER.asc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_IAM_ROLE);
        List<MbIamRoleRecord> records = dsl.selectFrom(MB_IAM_ROLE)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    public List<MbIamRoleRecord> findAllEnabled() {
        return dsl.selectFrom(MB_IAM_ROLE)
            .where(MB_IAM_ROLE.STATUS.eq((short) 1))
            .orderBy(MB_IAM_ROLE.SORT_ORDER.asc())
            .fetch();
    }

    public Long insert(MbIamRoleRecord record) {
        dsl.insertInto(MB_IAM_ROLE).set(record).execute();
        return record.getId();
    }

    public int update(MbIamRoleRecord record) {
        return dsl.update(MB_IAM_ROLE)
            .set(record)
            .where(MB_IAM_ROLE.ID.eq(record.getId()))
            .and(MB_IAM_ROLE.VERSION.eq(record.getVersion() - 1))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_ROLE).where(MB_IAM_ROLE.ID.eq(id)).execute();
    }

    /** 查询用户的角色 ID 列表 */
    public List<Long> findRoleIdsByUserId(Long userId) {
        return dsl.select(MB_IAM_USER_ROLE.ROLE_ID)
            .from(MB_IAM_USER_ROLE)
            .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
            .fetchInto(Long.class);
    }

    /** 查询用户的角色列表 */
    public List<MbIamRoleRecord> findByUserId(Long userId) {
        return dsl.selectFrom(MB_IAM_ROLE)
            .where(MB_IAM_ROLE.ID.in(
                dsl.select(MB_IAM_USER_ROLE.ROLE_ID)
                    .from(MB_IAM_USER_ROLE)
                    .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
            ))
            .fetch();
    }

    /** 批量删除用户的角色关联 */
    public void deleteUserRoles(Long userId) {
        dsl.deleteFrom(MB_IAM_USER_ROLE)
            .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
            .execute();
    }

    /** 批量插入用户的角色关联 */
    public void insertUserRoles(Long userId, List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) return;
        var records = roleIds.stream()
            .map(roleId -> {
                var r = new MbIamUserRoleRecord();
                r.setUserId(userId);
                r.setRoleId(roleId);
                return r;
            })
            .toList();
        dsl.batchInsert(records).execute();
    }
}
