package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Sa-Token 隔离规则：只有 infra-security 和 infra-exception 可以依赖 Sa-Token。
 * 业务层、平台层均通过 CurrentUser / AuthFacade 门面访问认证，零感知 Sa-Token。
 *
 * <p>规则 #6 + #20：防止 Sa-Token API 泄漏到 Service/Controller 层。</p>
 */
public final class SaTokenIsolationRule {

    private SaTokenIsolationRule() {}

    /**
     * 业务层（platform domain/web + business）不得直接依赖 Sa-Token。
     * 必须通过 CurrentUser/AuthFacade 门面接口。
     */
    public static final ArchRule BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN =
        noClasses()
            .that().resideInAnyPackage(
                "com.metabuild.platform..domain..",
                "com.metabuild.platform..web..",
                "com.metabuild.business.."
            )
            .should().dependOnClassesThat().resideInAPackage("cn.dev33.satoken..")
            .allowEmptyShould(true)  // mb-business 目前为空，M5 前保留
            .because("业务层只能通过 CurrentUser/AuthFacade 接口访问认证，不能直接依赖 Sa-Token");

    /**
     * 全项目范围：只有 infra-security 和 infra-exception 可以依赖 Sa-Token。
     */
    public static final ArchRule ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN =
        noClasses()
            .that().resideOutsideOfPackages(
                "com.metabuild.infra.security..",
                "com.metabuild.infra.exception.."
            )
            .should().dependOnClassesThat().resideInAPackage("cn.dev33.satoken..")
            .because("Sa-Token 只允许 infra-security 和 infra-exception 访问，业务层通过门面接口隔离");
}
