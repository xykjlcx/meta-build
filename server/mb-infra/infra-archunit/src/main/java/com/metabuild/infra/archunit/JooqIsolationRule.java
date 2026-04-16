package com.metabuild.infra.archunit;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import org.jooq.DSLContext;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * jOOQ 隔离规则：Service/Controller 层禁止持有 DSLContext。
 * jOOQ 操作只允许出现在 Repository 中（domain 子包内的 *Repository 类）。
 *
 * <p>规则 #2：DSLCONTEXT 只能作为 Repository 字段。</p>
 * <p>规则 #13：NO_RAW_SQL_FETCH，业务层禁止使用 jOOQ @PlainSQL API。</p>
 * <p>规则 #15：SERVICE_JOOQ_WHITELIST，Service 对 jOOQ 依赖仅限 Record/Result/exception 白名单。</p>
 */
public final class JooqIsolationRule {

    private JooqIsolationRule() {}

    /**
     * Service 和 Controller 层不得依赖 DSLContext。
     * domain 层内只有 Repository 可以使用 jOOQ。
     * M1 阶段保留粗粒度防线，M4 由 DSLCONTEXT_ONLY_IN_REPOSITORY + SERVICE_JOOQ_WHITELIST 精化。
     */
    public static final ArchRule DOMAIN_MUST_NOT_USE_JOOQ =
        ArchRuleDefinition.noClasses()
            .that().resideInAnyPackage(
                "..domain..",
                "..web.."
            )
            .and().haveSimpleNameNotEndingWith("Repository")
            .should().dependOnClassesThat().areAssignableTo(DSLContext.class)
            .allowEmptyShould(true)  // M4 业务模块落地前保留
            .because("jOOQ DSLContext 只允许在 Repository 中使用（防止 SQL 泄漏到 Service/Controller 层）");

    /**
     * 规则 #13：NO_RAW_SQL_FETCH（C4）
     * 业务层禁止使用 jOOQ @PlainSQL 注解标注的 API——这些 API 绕过 DataScopeExecuteListener 数据权限拦截。
     * 类型安全的 DSL 查询由 VisitListener 自动注入 WHERE 条件；@PlainSQL 字符串 SQL 不经过 VisitListener。
     */
    public static final ArchRule NO_PLAIN_SQL_ANNOTATION =
        noClasses()
            .that().resideInAnyPackage(
                "com.metabuild.platform..",
                "com.metabuild.business.."
            )
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("org.jooq.PlainSQL")
            .allowEmptyShould(true)  // M4 业务模块落地前保留
            .because("禁止使用 @PlainSQL 原始字符串 SQL，会绕过 DataScopeExecuteListener 数据权限拦截（规则 #13）");

    /**
     * 规则 #15b：SERVICE_JOOQ_WHITELIST（C8，N3 精化）
     * Service（@Service 标注类）对 org.jooq 的依赖仅限 Record/Result/exception 白名单。
     * 禁止 Service 依赖 DSLContext / DSL / Field / Condition / SelectXxxStep 等 DSL 构建类。
     * Repository（@Repository 标注类）不受此约束，可以使用完整 jOOQ DSL。
     */
    public static final ArchRule SERVICE_JOOQ_WHITELIST =
        classes()
            .that().resideInAnyPackage(
                "com.metabuild.platform..",
                "com.metabuild.business.."
            )
            .and().areAnnotatedWith("org.springframework.stereotype.Service")
            .should(onlyDependOnJooqDataCarriers())
            .allowEmptyShould(true)  // M4 业务模块落地前保留
            .because("Service 层对 jOOQ 依赖仅限 Record/Result/exception 白名单，DSL 查询只在 Repository 里写（规则 #15，N3 C8）");

    private static ArchCondition<JavaClass> onlyDependOnJooqDataCarriers() {
        return new ArchCondition<>("only depend on jOOQ data carriers (Record/Result/exception)") {
            @Override
            public void check(JavaClass item, ConditionEvents events) {
                item.getDirectDependenciesFromSelf().stream()
                    .map(Dependency::getTargetClass)
                    .filter(t -> t.getPackageName().startsWith("org.jooq"))
                    .filter(t -> !isAllowedJooqType(t.getFullName()))
                    .forEach(t -> events.add(SimpleConditionEvent.violated(item,
                        item.getSimpleName() + " 依赖了禁止的 jOOQ 类型: " + t.getFullName()
                        + "（Service 层只允许使用 Record/Result/exception 相关类型）")));
            }

            private boolean isAllowedJooqType(String name) {
                // Record 及其子接口（Record, Record1-22, TableRecord, UpdatableRecord）
                if (name.startsWith("org.jooq.Record")) return true;
                if (name.equals("org.jooq.UpdatableRecord")) return true;
                if (name.equals("org.jooq.TableRecord")) return true;
                // 查询结果容器
                if (name.equals("org.jooq.Result")) return true;
                // jOOQ 异常包
                if (name.startsWith("org.jooq.exception.")) return true;
                return false;
            }
        };
    }
}
