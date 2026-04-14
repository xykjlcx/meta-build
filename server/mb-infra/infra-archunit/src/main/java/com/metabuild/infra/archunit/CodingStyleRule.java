package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

/**
 * 编码风格规则集：禁止 MapStruct、JetBrains 注解、Optional 字段/参数。
 *
 * <p>规则 #17：不使用 MapStruct，手写转换方法（保持代码可读性 + 避免 APT 复杂性）。</p>
 * <p>规则 #19：只允许 jakarta.annotation.Nullable，统一可空注解来源。</p>
 * <p>规则 #20：Optional 只能作为方法返回值，禁作字段类型和方法参数（Brian Goetz 设计意图）。</p>
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

    /**
     * 规则 #20a：OPTIONAL_ONLY_RETURN（C4）
     * Optional 禁止作为字段类型。
     * Optional 不实现 Serializable，作为字段会导致序列化失败；Brian Goetz 明确设计意图是"仅用于返回值"。
     */
    public static final ArchRule OPTIONAL_ONLY_RETURN =
        noFields()
            .that().areDeclaredInClassesThat().resideInAPackage("com.metabuild..")
            .should().haveRawType(java.util.Optional.class)
            .allowEmptyShould(true)  // M4 业务代码落地前保留
            .because("Optional 只能作返回值，禁作字段类型（Brian Goetz 设计意图，规则 #20a）");

    /**
     * 规则 #20b：NO_OPTIONAL_PARAMETERS（C4）
     * Optional 禁止作为方法参数。
     * 应使用方法重载或 @Nullable 替代。
     */
    public static final ArchRule NO_OPTIONAL_PARAMETERS =
        noMethods()
            .that().areDeclaredInClassesThat().resideInAPackage("com.metabuild..")
            .should().haveRawParameterTypes(java.util.Optional.class)
            .allowEmptyShould(true)  // M4 业务代码落地前保留
            .because("Optional 禁作方法参数，应使用方法重载或 @Nullable 替代（规则 #20b）");
}
