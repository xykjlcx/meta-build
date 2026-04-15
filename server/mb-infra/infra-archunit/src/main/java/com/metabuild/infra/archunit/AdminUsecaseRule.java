package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Admin 端 usecase / web 边界规则：
 * 1. usecase 只能依赖模块公开 API 和共享层，不碰模块内部实现
 * 2. admin/web 只做 HTTP 适配，不直接依赖 platform / business 模块
 */
public final class AdminUsecaseRule {

    private AdminUsecaseRule() {}

    /**
     * mb-admin/usecase 只允许编排公开能力，不允许直接依赖模块内部实现。
     *
     * <p>allowEmptyShould(true)：当前仓库尚未落地 admin/usecase 代码，先固化规则意图。</p>
     */
    public static final ArchRule ADMIN_USECASE_ONLY_DEPENDS_ON_MODULE_API_OR_SHARED =
        classes()
            .that().resideInAPackage("com.metabuild.admin.usecase..")
            .should().onlyDependOnClassesThat().resideInAnyPackage(
                "com.metabuild.admin.usecase..",
                "com.metabuild.platform..api..",
                "com.metabuild.business..api..",
                "com.metabuild.common..",
                "com.metabuild.infra..",
                "java..",
                "jakarta..",
                "org.springframework..",
                "org.slf4j.."
            )
            .allowEmptyShould(true)
            .because("mb-admin/usecase 只做管理端特有流程编排，必须依赖模块公开 API，而不是模块内部实现");

    /**
     * mb-admin/web 不能直接依赖 platform / business 模块，必须通过 mb-admin/usecase 中转。
     *
     * <p>allowEmptyShould(true)：当前仓库尚未落地 admin/web Controller，先固化规则意图。</p>
     */
    public static final ArchRule ADMIN_WEB_MUST_NOT_DEPEND_ON_MODULES_DIRECTLY =
        noClasses()
            .that().resideInAPackage("com.metabuild.admin.web..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "com.metabuild.platform..",
                "com.metabuild.business.."
            )
            .allowEmptyShould(true)
            .because("mb-admin/web 只做 HTTP 适配，跨模块组合必须下沉到 mb-admin/usecase");
}
