package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 配置管理规则：禁止使用 @Value，强制使用 @ConfigurationProperties。
 *
 * <p>规则 #24：@Value 散落各处难以管理，统一使用类型安全的 @ConfigurationProperties。</p>
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
}
