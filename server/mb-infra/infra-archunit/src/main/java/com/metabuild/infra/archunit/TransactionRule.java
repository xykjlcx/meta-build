package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 事务规则：@Transactional 只允许用在 Service 层（domain 包）。
 *
 * <p>规则 #10：Controller 层不得使用 @Transactional，避免事务边界不清晰。</p>
 * <p>使用完全限定名避免对 spring-tx 的编译时依赖。</p>
 */
public final class TransactionRule {

    private TransactionRule() {}

    /**
     * Controller/Web 层不得使用 @Transactional。
     * 事务边界由 Service 层管理。
     */
    public static final ArchRule TRANSACTIONAL_NOT_IN_WEB_LAYER =
        noClasses()
            .that().resideInAPackage("..web..")
            .should().beAnnotatedWith("org.springframework.transaction.annotation.Transactional")
            .because("@Transactional 只允许在 Service 层使用，不得出现在 Controller/Web 层");

    /**
     * API 接口/DTO 层不得使用 @Transactional。
     */
    public static final ArchRule TRANSACTIONAL_NOT_IN_API_LAYER =
        noClasses()
            .that().resideInAPackage("..api..")
            .should().beAnnotatedWith("org.springframework.transaction.annotation.Transactional")
            .allowEmptyShould(true)  // api 包有 DTO/接口，理论上不应有此注解
            .because("@Transactional 只允许在 Service 层使用，不得出现在 API/DTO 层");
}
