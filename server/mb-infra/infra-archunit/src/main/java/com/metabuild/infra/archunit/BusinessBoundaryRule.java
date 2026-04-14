package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 业务边界规则：mb-business 只能依赖 platform 的 api 包（接口 + DTO）。
 *
 * <p>规则 #11：business 层是使用者扩展位，只能通过 platform api 包调用平台能力，
 * 不得直接依赖 platform 的 domain（内部实现）、web（Controller）或 config 包。</p>
 */
public final class BusinessBoundaryRule {

    private BusinessBoundaryRule() {}

    /**
     * business 层禁止依赖 platform 的 domain/web/config 包。
     * 只允许通过 platform api 包交互。
     * allowEmptyShould(true)：M5 前 mb-business 为空模块。
     */
    public static final ArchRule BUSINESS_ONLY_DEPENDS_ON_PLATFORM_API =
        noClasses()
            .that().resideInAPackage("com.metabuild.business..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "com.metabuild.platform..domain..",
                "com.metabuild.platform..web..",
                "com.metabuild.platform..config.."
            )
            .allowEmptyShould(true)  // M5 前 mb-business 为空，届时移除此豁免
            .because("business 层只能依赖 platform 的 api 包（接口 + DTO），不得访问 platform 内部实现");
}
