package com.metabuild.platform.iam.domain.dept;

import com.metabuild.schema.tables.records.MbIamDeptRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamDept.MB_IAM_DEPT;
import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 部门数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class DeptRepository {

    private final DSLContext dsl;
    private final Clock clock;

    public Optional<MbIamDeptRecord> findById(Long id) {
        return dsl.selectFrom(MB_IAM_DEPT)
            .where(MB_IAM_DEPT.ID.eq(id))
            .fetchOptional();
    }

    public List<MbIamDeptRecord> findAll() {
        return dsl.selectFrom(MB_IAM_DEPT)
            .orderBy(MB_IAM_DEPT.SORT_ORDER.asc())
            .fetch();
    }

    public List<MbIamDeptRecord> findByParentId(Long parentId) {
        return dsl.selectFrom(MB_IAM_DEPT)
            .where(MB_IAM_DEPT.PARENT_ID.eq(parentId))
            .orderBy(MB_IAM_DEPT.SORT_ORDER.asc())
            .fetch();
    }

    /**
     * 通过 WITH RECURSIVE CTE 一次性查询指定部门及其所有子孙部门的 ID。
     * 避免在 Java 层递归查询，减少 N+1 数据库往返。
     */
    public List<Long> findAllChildDeptIds(Long deptId) {
        // WITH RECURSIVE dept_tree(id) AS (
        //   SELECT id FROM mb_iam_dept WHERE id = :deptId
        //   UNION ALL
        //   SELECT d.id FROM mb_iam_dept d JOIN dept_tree dt ON d.parent_id = dt.id
        // )
        // SELECT id FROM dept_tree
        var deptTree = DSL.name("dept_tree");
        var id = DSL.field(DSL.name("id"), Long.class);

        return dsl.withRecursive(deptTree.as(
                DSL.select(MB_IAM_DEPT.ID)
                    .from(MB_IAM_DEPT)
                    .where(MB_IAM_DEPT.ID.eq(deptId))
                .unionAll(
                    DSL.select(MB_IAM_DEPT.ID)
                        .from(MB_IAM_DEPT)
                        .join(DSL.table(deptTree))
                        .on(MB_IAM_DEPT.PARENT_ID.eq(id))
                )
            ))
            .select(id)
            .from(DSL.table(deptTree))
            .fetch(id);
    }

    public boolean hasChildren(Long id) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_DEPT).where(MB_IAM_DEPT.PARENT_ID.eq(id))
        );
    }

    public Long insert(MbIamDeptRecord record) {
        dsl.insertInto(MB_IAM_DEPT).set(record).execute();
        return record.getId();
    }

    /**
     * 乐观锁更新部门。
     * Repository 层负责 version + 1 和 updated_at/updated_by。
     */
    public int update(MbIamDeptRecord record, Long updatedBy) {
        return dsl.update(MB_IAM_DEPT)
            .set(MB_IAM_DEPT.PARENT_ID, record.getParentId())
            .set(MB_IAM_DEPT.NAME, record.getName())
            .set(MB_IAM_DEPT.LEADER_USER_ID, record.getLeaderUserId())
            .set(MB_IAM_DEPT.SORT_ORDER, record.getSortOrder())
            .set(MB_IAM_DEPT.STATUS, record.getStatus())
            .set(MB_IAM_DEPT.VERSION, MB_IAM_DEPT.VERSION.plus(1))
            .set(MB_IAM_DEPT.UPDATED_BY, updatedBy)
            .set(MB_IAM_DEPT.UPDATED_AT, OffsetDateTime.now(clock))
            .where(MB_IAM_DEPT.ID.eq(record.getId()))
            .and(MB_IAM_DEPT.VERSION.eq(record.getVersion()))
            .execute();
    }

    /** 检查部门下是否有用户（删除前校验） */
    public boolean hasUsers(Long deptId) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_USER).where(MB_IAM_USER.DEPT_ID.eq(deptId))
        );
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_DEPT).where(MB_IAM_DEPT.ID.eq(id)).execute();
    }
}
