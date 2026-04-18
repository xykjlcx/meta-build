package com.metabuild.platform.iam.domain.role;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.query.SortParser;
import com.metabuild.schema.tables.records.MbIamRoleRecord;
import com.metabuild.schema.tables.records.MbIamUserRoleRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamRole.MB_IAM_ROLE;
import static com.metabuild.schema.tables.MbIamRoleDataScopeDept.MB_IAM_ROLE_DATA_SCOPE_DEPT;
import static com.metabuild.schema.tables.MbIamUserRole.MB_IAM_USER_ROLE;

/**
 * 角色数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class RoleRepository {

    private final DSLContext dsl;
    private final Clock clock;

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

    /**
     * 乐观锁更新角色。
     * Repository 层负责 version + 1 和 updated_at/updated_by。
     */
    public int update(MbIamRoleRecord record, Long updatedBy) {
        return dsl.update(MB_IAM_ROLE)
            .set(MB_IAM_ROLE.NAME, record.getName())
            .set(MB_IAM_ROLE.SORT_ORDER, record.getSortOrder())
            .set(MB_IAM_ROLE.STATUS, record.getStatus())
            .set(MB_IAM_ROLE.DATA_SCOPE, record.getDataScope())
            .set(MB_IAM_ROLE.REMARK, record.getRemark())
            .set(MB_IAM_ROLE.VERSION, MB_IAM_ROLE.VERSION.plus(1))
            .set(MB_IAM_ROLE.UPDATED_BY, updatedBy)
            .set(MB_IAM_ROLE.UPDATED_AT, OffsetDateTime.now(clock))
            .where(MB_IAM_ROLE.ID.eq(record.getId()))
            .and(MB_IAM_ROLE.VERSION.eq(record.getVersion()))
            .execute();
    }

    /** 删除角色关联的用户角色记录 */
    public void deleteUserRolesByRoleId(Long roleId) {
        dsl.deleteFrom(MB_IAM_USER_ROLE)
            .where(MB_IAM_USER_ROLE.ROLE_ID.eq(roleId))
            .execute();
    }

    /** 删除角色关联的角色菜单记录 */
    public void deleteRoleMenusByRoleId(Long roleId) {
        dsl.deleteFrom(com.metabuild.schema.tables.MbIamRoleMenu.MB_IAM_ROLE_MENU)
            .where(com.metabuild.schema.tables.MbIamRoleMenu.MB_IAM_ROLE_MENU.ROLE_ID.eq(roleId))
            .execute();
    }

    /** 删除角色关联的数据权限部门记录 */
    public void deleteDataScopeDeptsByRoleId(Long roleId) {
        dsl.deleteFrom(MB_IAM_ROLE_DATA_SCOPE_DEPT)
            .where(MB_IAM_ROLE_DATA_SCOPE_DEPT.ROLE_ID.eq(roleId))
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

    /** 删除用户与指定角色子集的关联 */
    public void deleteUserRolesByUserAndRoleIds(Long userId, java.util.Set<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) return;
        dsl.deleteFrom(MB_IAM_USER_ROLE)
            .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
            .and(MB_IAM_USER_ROLE.ROLE_ID.in(roleIds))
            .execute();
    }

    /** 查询持有指定角色的全部用户 ID */
    public List<Long> findUserIdsByRoleId(Long roleId) {
        return dsl.select(MB_IAM_USER_ROLE.USER_ID)
            .from(MB_IAM_USER_ROLE)
            .where(MB_IAM_USER_ROLE.ROLE_ID.eq(roleId))
            .fetchInto(Long.class);
    }

    /** 查询指定角色列表对应的自定义数据权限部门 ID */
    public List<Long> findDataScopeDeptIds(List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) return List.of();
        return dsl.selectDistinct(MB_IAM_ROLE_DATA_SCOPE_DEPT.DEPT_ID)
            .from(MB_IAM_ROLE_DATA_SCOPE_DEPT)
            .where(MB_IAM_ROLE_DATA_SCOPE_DEPT.ROLE_ID.in(roleIds))
            .fetchInto(Long.class);
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
