package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import org.jooq.DSLContext;

/**
 * jOOQ 隔离规则：Service/Controller 层禁止持有 DSLContext。
 * jOOQ 操作只允许出现在 Repository 中（domain 子包内的 *Repository 类）。
 */
public final class JooqIsolationRule {

    private JooqIsolationRule() {}

    /**
     * Service 和 Controller 层不得依赖 DSLContext。
     * domain 层内只有 Repository 可以使用 jOOQ。
     */
    public static final ArchRule DOMAIN_MUST_NOT_USE_JOOQ =
        ArchRuleDefinition.noClasses()
            .that().resideInAnyPackage(
                "..domain..",
                "..web.."
            )
            .and().haveSimpleNameNotEndingWith("Repository")
            .should().dependOnClassesThat().areAssignableTo(DSLContext.class)
            .because("jOOQ DSLContext 只允许在 Repository 中使用（防止 SQL 泄漏到 Service/Controller 层）");
}
