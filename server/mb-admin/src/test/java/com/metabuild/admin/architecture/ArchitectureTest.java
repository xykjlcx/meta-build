package com.metabuild.admin.architecture;

import com.metabuild.infra.archunit.BusinessBoundaryRule;
import com.metabuild.infra.archunit.CodingStyleRule;
import com.metabuild.infra.archunit.ConfigManagementRule;
import com.metabuild.infra.archunit.ControllerRule;
import com.metabuild.infra.archunit.DoNotIncludeGeneratedJooq;
import com.metabuild.infra.archunit.GeneralCodingRulesBundle;
import com.metabuild.infra.archunit.JdbcIsolationRule;
import com.metabuild.infra.archunit.JooqIsolationRule;
import com.metabuild.infra.archunit.ModuleBoundaryRule;
import com.metabuild.infra.archunit.SaTokenIsolationRule;
import com.metabuild.infra.archunit.TimezoneRule;
import com.metabuild.infra.archunit.TransactionRule;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * ArchUnit 架构测试——M4 Phase 4 扩展至 18+ 条规则。
 *
 * <p>规则分组：</p>
 * <ul>
 *   <li>分层架构：jOOQ 隔离、Sa-Token 隔离、Controller 规则、事务规则、JDBC 隔离</li>
 *   <li>模块边界：平台模块跨模块访问、循环依赖、business 边界</li>
 *   <li>编码风格：MapStruct 禁用、JetBrains 注解禁用、@Value 禁用、时区规则</li>
 *   <li>通用规则：字段注入、标准流、JUL 日志</li>
 * </ul>
 */
class ArchitectureTest {

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        // 注意：不加 DoNotIncludeArchives，否则只扫描 mb-admin 自身目录，
        // platform-* 模块以 jar 形式在 classpath 上，必须允许扫描 archive。
        // DoNotIncludeGeneratedJooq 过滤 jOOQ 生成代码防止误报。
        classes = new ClassFileImporter()
            .withImportOption(new ImportOption.DoNotIncludeTests())
            .withImportOption(new DoNotIncludeGeneratedJooq())
            .importPackages("com.metabuild");
    }

    // ========== 分层架构：jOOQ 隔离 ==========

    @Test
    void domain_must_not_use_jooq() {
        JooqIsolationRule.DOMAIN_MUST_NOT_USE_JOOQ.check(classes);
    }

    // ========== 分层架构：Sa-Token 隔离 ==========

    @Test
    void business_must_not_depend_on_sa_token() {
        SaTokenIsolationRule.BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN.check(classes);
    }

    @Test
    void only_infra_security_depends_on_sa_token() {
        SaTokenIsolationRule.ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN.check(classes);
    }

    // ========== 分层架构：Controller 规则 ==========

    @Test
    void controller_no_direct_repository() {
        ControllerRule.CONTROLLER_NO_DIRECT_REPOSITORY.check(classes);
    }

    @Test
    void controller_must_be_rest_controller() {
        ControllerRule.CONTROLLER_MUST_BE_REST_CONTROLLER.check(classes);
    }

    // ========== 分层架构：事务规则 ==========

    @Test
    void transactional_not_in_web_layer() {
        TransactionRule.TRANSACTIONAL_NOT_IN_WEB_LAYER.check(classes);
    }

    @Test
    void transactional_not_in_api_layer() {
        TransactionRule.TRANSACTIONAL_NOT_IN_API_LAYER.check(classes);
    }

    // ========== 分层架构：JDBC 隔离 ==========

    @Test
    void no_jdbc_template_in_business() {
        JdbcIsolationRule.NO_JDBC_TEMPLATE_IN_BUSINESS.check(classes);
    }

    // ========== 模块边界 ==========

    @Test
    void cross_platform_only_via_api() {
        ModuleBoundaryRule.CROSS_PLATFORM_ONLY_VIA_API.check(classes);
    }

    @Test
    void no_cyclic_dependencies() {
        ModuleBoundaryRule.NO_CYCLIC_DEPENDENCIES.check(classes);
    }

    @Test
    void business_only_depends_on_platform_api() {
        BusinessBoundaryRule.BUSINESS_ONLY_DEPENDS_ON_PLATFORM_API.check(classes);
    }

    // ========== 编码风格 ==========

    @Test
    void no_mapstruct() {
        CodingStyleRule.NO_MAPSTRUCT.check(classes);
    }

    @Test
    void no_jetbrains_nullable() {
        CodingStyleRule.NO_JETBRAINS_NULLABLE.check(classes);
    }

    @Test
    void no_jetbrains_not_null() {
        CodingStyleRule.NO_JETBRAINS_NOT_NULL.check(classes);
    }

    @Test
    void no_at_value_annotation() {
        ConfigManagementRule.NO_AT_VALUE_ANNOTATION.check(classes);
    }

    @Test
    void no_localdatetime_in_api() {
        TimezoneRule.NO_LOCALDATETIME_IN_API.check(classes);
    }

    // ========== 通用编码规则 ==========

    @Test
    void no_field_injection() {
        GeneralCodingRulesBundle.NO_FIELD_INJECTION.check(classes);
    }

    @Test
    void no_standard_streams() {
        GeneralCodingRulesBundle.NO_STANDARD_STREAMS.check(classes);
    }

    @Test
    void no_java_util_logging() {
        GeneralCodingRulesBundle.NO_JAVA_UTIL_LOGGING.check(classes);
    }
}
