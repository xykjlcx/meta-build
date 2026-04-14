package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 时区规则：API/DTO 层禁止使用 LocalDateTime。
 *
 * <p>规则 #9：API 层时间类型必须使用 OffsetDateTime（对应 DDL TIMESTAMPTZ），
 * 不得使用无时区的 LocalDateTime，防止跨时区部署时时间语义错误。</p>
 */
public final class TimezoneRule {

    private TimezoneRule() {}

    /**
     * API 层（DTO、接口）禁止使用 LocalDateTime。
     * 必须使用 OffsetDateTime 保留时区信息。
     */
    public static final ArchRule NO_LOCALDATETIME_IN_API =
        noClasses()
            .that().resideInAPackage("..api..")
            .should().dependOnClassesThat().haveFullyQualifiedName("java.time.LocalDateTime")
            .allowEmptyShould(true)  // 当前 api 包 DTO 尚未有时间字段，规则预置
            .because("API 层只能使用 OffsetDateTime（对应 DDL TIMESTAMPTZ），不得使用无时区的 LocalDateTime");
}
