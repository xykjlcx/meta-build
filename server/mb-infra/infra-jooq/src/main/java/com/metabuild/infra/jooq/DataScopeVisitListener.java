package com.metabuild.infra.jooq;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.DataScopeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Clause;
import org.jooq.Condition;
import org.jooq.Field;
import org.jooq.QueryPart;
import org.jooq.SelectQuery;
import org.jooq.Table;
import org.jooq.VisitContext;
import org.jooq.VisitListener;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.ObjectProvider;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Set;

/**
 * 数据权限 SQL 拦截器：在 jOOQ 构建 SELECT 语句时，自动注入部门数据权限过滤条件。
 *
 * <p>实现原理：
 * <ol>
 *   <li>在 {@code TABLE_REFERENCE} 子句处，收集当前 SELECT 引用的已注册表</li>
 *   <li>在 {@code SELECT_WHERE} 子句结束时，向 SelectQuery 注入 WHERE 条件</li>
 * </ol>
 *
 * <p>通过 DataScopeRegistry 判断哪些表需要过滤，通过 BypassDataScopeAspect 支持跳过。
 *
 * <p>注意：jOOQ 3.19 将 {@link Clause} 标记为 deprecated（计划在未来版本移除），
 * 但目前仍是 VisitListener 扩展点的唯一可用机制，功能上完全正常。
 */
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("deprecation")
public class DataScopeVisitListener implements VisitListener {

    private final DataScopeRegistry registry;
    private final ObjectProvider<CurrentUser> currentUserProvider;

    // ThreadLocal 存储每个 SELECT 层级的已注册表栈（支持子查询嵌套）
    private static final ThreadLocal<Deque<Set<String>>> REGISTERED_TABLES_STACK =
            ThreadLocal.withInitial(ArrayDeque::new);

    // ---- SELECT 级别：入栈/出栈 ----

    @Override
    public void clauseStart(VisitContext context) {
        if (context.clause() == Clause.SELECT) {
            // 进入新的 SELECT 层级，压栈
            REGISTERED_TABLES_STACK.get().push(new java.util.LinkedHashSet<>());
        }
    }

    @Override
    public void clauseEnd(VisitContext context) {
        // 在 SELECT_WHERE 子句结束时注入条件
        if (context.clause() == Clause.SELECT_WHERE) {
            injectDataScopeConditions(context);
        }

        // SELECT 语句结束，弹栈
        if (context.clause() == Clause.SELECT) {
            Deque<Set<String>> stack = REGISTERED_TABLES_STACK.get();
            if (!stack.isEmpty()) {
                stack.pop();
            }
            // 栈为空时清理 ThreadLocal，避免内存泄漏
            if (stack.isEmpty()) {
                REGISTERED_TABLES_STACK.remove();
            }
        }
    }

    // ---- TABLE_REFERENCE：收集表名 ----

    @Override
    public void visitStart(VisitContext context) {
        if (context.clause() == Clause.TABLE_REFERENCE) {
            QueryPart part = context.queryPart();
            if (part instanceof Table<?> table) {
                String tableName = table.getName().toLowerCase();
                if (registry.isRegistered(tableName)) {
                    Deque<Set<String>> stack = REGISTERED_TABLES_STACK.get();
                    if (!stack.isEmpty()) {
                        stack.peek().add(tableName);
                    }
                }
            }
        }
    }

    // ---- 注入过滤条件 ----

    private void injectDataScopeConditions(VisitContext context) {
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

        // 获取当前 SELECT 层级收集到的表
        Deque<Set<String>> stack = REGISTERED_TABLES_STACK.get();
        if (stack.isEmpty()) {
            return;
        }
        Set<String> tables = stack.peek();
        if (tables == null || tables.isEmpty()) {
            return;
        }

        // 取得顶层查询
        QueryPart topLevel = context.context().topLevel();
        if (!(topLevel instanceof SelectQuery<?> selectQuery)) {
            return;
        }

        // 对每个注册的表注入条件
        for (String tableName : tables) {
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
