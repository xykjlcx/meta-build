package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;

import static com.tngtech.archunit.base.DescribedPredicate.alwaysTrue;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;

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
     * <p>
     * 使用 slices API 避免误判：同一模块内 domain/web 包互依是合法的，
     * 跨模块依赖仅当 target 在 api 包时允许。
     * allowEmptyShould(true)：M4 平台模块代码补全后移除。
     */
    public static final ArchRule CROSS_PLATFORM_ONLY_VIA_API =
        SlicesRuleDefinition.slices()
            .matching("com.metabuild.platform.(*)..")
            .should().notDependOnEachOther()
            .ignoreDependency(
                alwaysTrue(),                        // 任意 source
                resideInAPackage("..api..")          // 依赖 target 在 api 包 → 允许
            )
            .allowEmptyShould(true);  // M4 平台模块代码补全后移除

    /**
     * 无循环依赖。
     */
    public static final ArchRule NO_CYCLIC_DEPENDENCIES =
        SlicesRuleDefinition.slices()
            .matching("com.metabuild.(*)..")
            .should().beFreeOfCycles()
            .because("模块间不允许循环依赖");
}
