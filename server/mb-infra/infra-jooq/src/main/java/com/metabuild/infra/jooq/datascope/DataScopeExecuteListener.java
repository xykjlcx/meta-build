package com.metabuild.infra.jooq.datascope;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.DataScopeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.ExecuteContext;
import org.jooq.ExecuteListener;
import org.jooq.Field;
import org.jooq.SelectQuery;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Set;

/**
 * 数据权限 SQL 拦截器：在 jOOQ 渲染 SELECT 语句之前，自动注入部门数据权限过滤条件。
 */
@Slf4j
@RequiredArgsConstructor
public class DataScopeExecuteListener implements ExecuteListener {

    private final DataScopeRegistry registry;
    private final ObjectProvider<CurrentUser> currentUserProvider;

    @Override
    public void renderStart(ExecuteContext ctx) {
        // 只处理 SELECT 查询
        if (!(ctx.query() instanceof SelectQuery<?> selectQuery)) {
            return;
        }

        if (BypassDataScopeAspect.isBypassed()) {
            return;
        }

        CurrentUser currentUser = resolveCurrentUser();
        if (currentUser == null || !currentUser.isAuthenticated()) {
            return;
        }

        DataScopeType scopeType = currentUser.dataScopeType();
        if (scopeType == DataScopeType.ALL || currentUser.isAdmin()) {
            return;
        }

        for (Table<?> table : selectQuery.$from()) {
            String tableName = table.getName().toLowerCase();
            if (!registry.isRegistered(tableName)) {
                continue;
            }
            registry.getDeptColumn(tableName).ifPresent(deptColumn -> {
                Condition condition = buildCondition(tableName, deptColumn, currentUser, scopeType);
                selectQuery.addConditions(condition);
                log.debug("数据权限注入 [表={}, 列={}, 权限类型={}]", tableName, deptColumn, scopeType);
            });
        }
    }

    private CurrentUser resolveCurrentUser() {
        try {
            return currentUserProvider.getIfAvailable();
        } catch (Exception e) {
            log.debug("数据权限过滤：获取 CurrentUser 失败，跳过", e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Condition buildCondition(String tableName, String deptColumn,
                                     CurrentUser currentUser, DataScopeType scopeType) {
        Field<Long> deptField = DSL.field(DSL.name(tableName, deptColumn), Long.class);

        return switch (scopeType) {
            case SELF -> {
                Field<Long> createdByField = DSL.field(DSL.name(tableName, "created_by"), Long.class);
                yield createdByField.eq(currentUser.userId());
            }
            case OWN_DEPT -> {
                Long deptId = currentUser.deptId();
                yield deptId != null ? deptField.eq(deptId) : DSL.falseCondition();
            }
            case OWN_DEPT_AND_CHILD -> {
                Set<Long> deptIds = currentUser.dataScopeDeptIds();
                if (deptIds != null && !deptIds.isEmpty()) {
                    yield deptField.in(deptIds);
                }
                Long deptId = currentUser.deptId();
                yield deptId != null ? deptField.eq(deptId) : DSL.falseCondition();
            }
            case CUSTOM_DEPT -> {
                Set<Long> deptIds = currentUser.dataScopeDeptIds();
                yield (deptIds != null && !deptIds.isEmpty())
                    ? deptField.in(deptIds)
                    : DSL.falseCondition();
            }
            default -> DSL.trueCondition();
        };
    }
}
