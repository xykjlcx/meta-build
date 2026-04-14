package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 配置管理规则：禁止使用 @Value，强制使用 @ConfigurationProperties + @Validated。
 *
 * <p>规则 #24：@Value 散落各处难以管理，统一使用类型安全的 @ConfigurationProperties。</p>
 * <p>规则 #15b：@ConfigurationProperties 类必须搭配 @Validated，启动时 fail-fast。</p>
 */
public final class ConfigManagementRule {

    private ConfigManagementRule() {}

    /**
     * 禁止在 com.metabuild 包中使用 @Value 注入配置。
     * 使用 @ConfigurationProperties 替代。
     */
    public static final ArchRule NO_AT_VALUE_ANNOTATION =
        noClasses()
            .that().resideInAPackage("com.metabuild..")
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("org.springframework.beans.factory.annotation.Value")
            .because("使用 @ConfigurationProperties 替代 @Value，配置类型安全且集中管理");

    /**
     * 规则 #15b：PROPERTIES_MUST_BE_VALIDATED（C4）
     * @ConfigurationProperties 类必须同时标注 @Validated，确保 Spring 启动时触发 Bean Validation。
     * 缺少 @Validated 时，@NotNull / @NotBlank 等约束在启动时不校验，配置错误会推迟到运行时暴露。
     */
    public static final ArchRule PROPERTIES_MUST_BE_VALIDATED =
        classes()
            .that().areAnnotatedWith("org.springframework.boot.context.properties.ConfigurationProperties")
            .should().beAnnotatedWith("org.springframework.validation.annotation.Validated")
            .allowEmptyShould(true)  // M4 @ConfigurationProperties 类落地前保留
            .because("@ConfigurationProperties 必须搭配 @Validated，启动时 fail-fast（规则 #15b，09-config-management.md §9.5）");
}
