package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Controller 层规则：
 * 1. Controller 不得直接持有 Repository（必须通过 Service 访问数据）
 * 2. 所有 *Controller 类必须用 @RestController 标注（防止 @Controller 误用）
 *
 * <p>规则 #7 + #8（部分）：保证分层架构纯洁性。</p>
 */
public final class ControllerRule {

    private ControllerRule() {}

    /**
     * Controller 层不得直接依赖 Repository。
     * 数据访问必须经由 Service 层。
     */
    public static final ArchRule CONTROLLER_NO_DIRECT_REPOSITORY =
        noClasses()
            .that().resideInAPackage("..web..")
            .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository")
            .because("Controller 必须通过 Service 访问数据，不得直接持有 Repository");

    /**
     * 所有命名为 *Controller 的类必须使用 @RestController 注解。
     * 使用完全限定名避免对 spring-web 的编译时依赖。
     */
    public static final ArchRule CONTROLLER_MUST_BE_REST_CONTROLLER =
        classes()
            .that().resideInAPackage("..web..")
            .and().haveSimpleNameEndingWith("Controller")
            .should().beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .because("Controller 必须使用 @RestController，禁止使用 @Controller（避免视图解析路径歧义）");
}
