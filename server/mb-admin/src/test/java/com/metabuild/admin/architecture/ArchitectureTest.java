package com.metabuild.admin.architecture;

import com.metabuild.infra.archunit.DoNotIncludeGeneratedJooq;
import com.metabuild.infra.archunit.JooqIsolationRule;
import com.metabuild.infra.archunit.ModuleBoundaryRule;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * ArchUnit 架构测试——M1 启动 3 条规则。
 * 使用 allowEmptyShould(true) 容许 M1 阶段 domain/web/platform 包尚不存在。
 */
class ArchitectureTest {

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
            .withImportOption(new ImportOption.DoNotIncludeTests())
            .withImportOption(new ImportOption.DoNotIncludeArchives())
            .withImportOption(new DoNotIncludeGeneratedJooq())
            .importPackages("com.metabuild");
    }

    @Test
    void domain_must_not_use_jooq() {
        JooqIsolationRule.DOMAIN_MUST_NOT_USE_JOOQ
            .allowEmptyShould(true)
            .check(classes);
    }

    @Test
    void cross_platform_only_via_api() {
        ModuleBoundaryRule.CROSS_PLATFORM_ONLY_VIA_API
            .allowEmptyShould(true)
            .check(classes);
    }

    @Test
    void no_cyclic_dependencies() {
        ModuleBoundaryRule.NO_CYCLIC_DEPENDENCIES.check(classes);
    }
}
