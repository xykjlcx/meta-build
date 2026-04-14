package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;

/**
 * 模块边界规则：
 * 1. 跨 platform 模块只能通过 api 子包访问
 * 2. 无循环依赖
 */
public final class ModuleBoundaryRule {

    private ModuleBoundaryRule() {}

    /**
     * platform 模块间只能通过 api 子包交互。
     * 例：platform-iam 的 Service 不能直接 import platform-oplog 的内部实现。
     */
    public static final ArchRule CROSS_PLATFORM_ONLY_VIA_API =
        ArchRuleDefinition.noClasses()
            .that().resideInAnyPackage("com.metabuild.platform.(*).domain..", "com.metabuild.platform.(*).web..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("com.metabuild.platform.(*).domain..", "com.metabuild.platform.(*).web..")
            .andShould().resideOutsideOfPackage("com.metabuild.platform.(*).api..")
            .because("跨 platform 模块交互只能通过 api 子包（DTO/Event/Interface）");

    /**
     * 无循环依赖。
     */
    public static final ArchRule NO_CYCLIC_DEPENDENCIES =
        SlicesRuleDefinition.slices()
            .matching("com.metabuild.(*)..")
            .should().beFreeOfCycles()
            .because("模块间不允许循环依赖");
}
