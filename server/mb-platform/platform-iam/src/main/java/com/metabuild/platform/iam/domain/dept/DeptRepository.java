package com.metabuild.platform.iam.domain.dept;

import com.metabuild.schema.tables.records.MbIamDeptRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamDept.MB_IAM_DEPT;

/**
 * 部门数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class DeptRepository {

    private final DSLContext dsl;

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

    public boolean hasChildren(Long id) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_DEPT).where(MB_IAM_DEPT.PARENT_ID.eq(id))
        );
    }

    public Long insert(MbIamDeptRecord record) {
        dsl.insertInto(MB_IAM_DEPT).set(record).execute();
        return record.getId();
    }

    public int update(MbIamDeptRecord record) {
        return dsl.update(MB_IAM_DEPT)
            .set(record)
            .where(MB_IAM_DEPT.ID.eq(record.getId()))
            .and(MB_IAM_DEPT.VERSION.eq(record.getVersion() - 1))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_DEPT).where(MB_IAM_DEPT.ID.eq(id)).execute();
    }
}
