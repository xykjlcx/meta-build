package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * JDBC 隔离规则：业务层禁止直接使用 JdbcTemplate。
 *
 * <p>规则 #27：平台层和业务层只能通过 jOOQ 访问数据库，
 * JdbcTemplate 只允许在 infra 基础设施层使用（例如 ShedLock 配置）。</p>
 */
public final class JdbcIsolationRule {

    private JdbcIsolationRule() {}

    /**
     * 平台层 domain/web 和业务层禁止使用 JdbcTemplate。
     * 数据访问统一通过 jOOQ。
     */
    public static final ArchRule NO_JDBC_TEMPLATE_IN_BUSINESS =
        noClasses()
            .that().resideInAnyPackage(
                "com.metabuild.platform..domain..",
                "com.metabuild.platform..web..",
                "com.metabuild.business.."
            )
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("org.springframework.jdbc.core.JdbcTemplate")
            .allowEmptyShould(true)  // mb-business 目前为空
            .because("业务层只能通过 jOOQ 访问数据库，禁止直接使用 JdbcTemplate");
}
