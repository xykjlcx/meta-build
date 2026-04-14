package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 编码风格规则集：禁止使用 MapStruct，禁止使用 JetBrains @Nullable。
 *
 * <p>规则 #17：不使用 MapStruct，手写转换方法（保持代码可读性 + 避免 APT 复杂性）。</p>
 * <p>规则 #19：只允许 jakarta.annotation.Nullable，统一可空注解来源。</p>
 */
public final class CodingStyleRule {

    private CodingStyleRule() {}

    /**
     * 禁止使用 MapStruct。
     * 对象映射使用手写转换方法，保持代码可读性。
     */
    public static final ArchRule NO_MAPSTRUCT =
        noClasses()
            .should().dependOnClassesThat().resideInAPackage("org.mapstruct..")
            .because("不使用 MapStruct，对象映射使用手写转换方法");

    /**
     * 禁止使用 JetBrains @Nullable / @NotNull。
     * 统一使用 jakarta.annotation.Nullable / jakarta.annotation.Nonnull。
     */
    public static final ArchRule NO_JETBRAINS_NULLABLE =
        noClasses()
            .should().dependOnClassesThat().haveFullyQualifiedName("org.jetbrains.annotations.Nullable")
            .because("只允许使用 jakarta.annotation.Nullable，不使用 JetBrains 的 @Nullable");

    /**
     * 禁止使用 JetBrains @NotNull。
     */
    public static final ArchRule NO_JETBRAINS_NOT_NULL =
        noClasses()
            .should().dependOnClassesThat().haveFullyQualifiedName("org.jetbrains.annotations.NotNull")
            .because("只允许使用 jakarta.annotation.Nonnull，不使用 JetBrains 的 @NotNull");
}
