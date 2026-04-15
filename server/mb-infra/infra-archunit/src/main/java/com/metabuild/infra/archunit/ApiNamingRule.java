package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

/**
 * API 命名规则：约束 API 子包的 DTO/错误码命名。
 */
public final class ApiNamingRule {

    private ApiNamingRule() {}

    public static final ArchRule API_VO_MUST_END_WITH_VO =
        classes()
            .that().resideInAPackage("..api.vo..")
            .and().areTopLevelClasses()
            .should().haveSimpleNameEndingWith("Vo")
            .because("api/vo 子包下的类型必须以 Vo 结尾");

    public static final ArchRule API_CMD_MUST_END_WITH_CMD =
        classes()
            .that().resideInAPackage("..api.cmd..")
            .and().areTopLevelClasses()
            .should().haveSimpleNameEndingWith("Cmd")
            .because("api/cmd 子包下的类型必须以 Cmd 结尾");

    public static final ArchRule API_QRY_MUST_END_WITH_QRY =
        classes()
            .that().resideInAPackage("..api.qry..")
            .and().areTopLevelClasses()
            .should().haveSimpleNameEndingWith("Qry")
            .because("api/qry 子包下的类型必须以 Qry 结尾");

    public static final ArchRule MODULE_ERROR_CODES_MUST_STAY_IN_API =
        classes()
            .that().haveSimpleNameEndingWith("ErrorCodes")
            .and().areTopLevelClasses()
            .and().doNotHaveFullyQualifiedName("com.metabuild.common.exception.CommonErrorCodes")
            .should().resideInAPackage("..api..")
            .because("模块级 ErrorCodes 必须留在 api 包，作为跨层契约的一部分");
}
