package com.metabuild.platform.iam.domain.menu;

import com.metabuild.schema.tables.records.MbIamRouteTreeRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.MbIamRouteTree.MB_IAM_ROUTE_TREE;

/**
 * 路由树数据访问层（前端导航路由，M2/M3 前端阶段写入）。
 */
@Repository
@RequiredArgsConstructor
public class RouteTreeRepository {

    private final DSLContext dsl;

    public List<MbIamRouteTreeRecord> findAll() {
        return dsl.selectFrom(MB_IAM_ROUTE_TREE)
            .orderBy(MB_IAM_ROUTE_TREE.SORT_ORDER.asc())
            .fetch();
    }

    public List<MbIamRouteTreeRecord> findByPermissionCode(String permissionCode) {
        return dsl.selectFrom(MB_IAM_ROUTE_TREE)
            .where(MB_IAM_ROUTE_TREE.PERMISSION_CODE.eq(permissionCode))
            .orderBy(MB_IAM_ROUTE_TREE.SORT_ORDER.asc())
            .fetch();
    }
}
