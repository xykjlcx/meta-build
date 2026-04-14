package com.metabuild.infra.jooq;

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
 *
 * <p>实现原理：
 * 使用 {@link ExecuteListener#renderStart(ExecuteContext)} 在 SQL 渲染开始前拦截，
 * 将数据权限 WHERE 条件通过 {@link SelectQuery#addConditions(Condition...)} 注入。
 * 此时机点在 SQL 字符串生成之前，确保注入的条件被包含在最终的 PreparedStatement 中。
 *
 * <p>通过 DataScopeRegistry 判断哪些表需要过滤，通过 BypassDataScopeAspect 支持跳过。
 *
 * <p>注意：使用 ExecuteListener 而非 VisitListener 的原因：
 * VisitListener.clauseEnd(SELECT_FROM) 触发时，jOOQ 内部可能已准备好 WHERE 条件列表的快照，
 * addConditions() 的修改无法影响已生成的 PreparedStatement SQL 字符串。
 * ExecuteListener.renderStart() 在 SQL 渲染前触发，addConditions() 可有效影响最终 SQL。
 */
@Slf4j
@RequiredArgsConstructor
public class DataScopeVisitListener implements ExecuteListener {

    private final DataScopeRegistry registry;
    private final ObjectProvider<CurrentUser> currentUserProvider;

    /**
     * 在 SQL 渲染开始前注入数据权限条件。
     * renderStart 是修改查询的正确时机：SQL 字符串尚未生成，addConditions() 可有效影响最终 SQL。
     */
    @Override
    public void renderStart(ExecuteContext ctx) {
        // 只处理 SELECT 查询
        if (!(ctx.query() instanceof SelectQuery<?> selectQuery)) {
            return;
        }

        // 跳过检查
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

        // 通过 jOOQ QOM API ($from()) 获取 FROM 子句中的表列表，避免触发 SQL 渲染（防止递归）
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

    /**
     * 根据数据权限类型构建过滤条件。
     */
    @SuppressWarnings("unchecked")
    private Condition buildCondition(String tableName, String deptColumn,
                                     CurrentUser currentUser, DataScopeType scopeType) {
        Field<Long> deptField = DSL.field(DSL.name(tableName, deptColumn), Long.class);

        return switch (scopeType) {
            case SELF -> {
                // 仅本人：过滤 created_by = userId
                Field<Long> createdByField = DSL.field(DSL.name(tableName, "created_by"), Long.class);
                yield createdByField.eq(currentUser.userId());
            }
            case OWN_DEPT -> {
                // 仅本部门
                Long deptId = currentUser.deptId();
                yield deptId != null ? deptField.eq(deptId) : DSL.falseCondition();
            }
            case OWN_DEPT_AND_CHILD -> {
                // 本部门及子部门
                Set<Long> deptIds = currentUser.dataScopeDeptIds();
                if (deptIds != null && !deptIds.isEmpty()) {
                    yield deptField.in(deptIds);
                }
                Long deptId = currentUser.deptId();
                yield deptId != null ? deptField.eq(deptId) : DSL.falseCondition();
            }
            case CUSTOM_DEPT -> {
                // 自定义部门集合
                Set<Long> deptIds = currentUser.dataScopeDeptIds();
                yield (deptIds != null && !deptIds.isEmpty())
                        ? deptField.in(deptIds)
                        : DSL.falseCondition();
            }
            default -> DSL.trueCondition();
        };
    }
}
