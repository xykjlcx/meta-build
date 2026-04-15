package com.metabuild.infra.archunit;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.tngtech.archunit.lang.ArchRule;

import java.util.List;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 分页契约规则：
 * 1. 只有 PaginationPolicy 可以创建内部可信的 PageQuery
 * 2. PageRequestDto 只能停留在 web 边界，不允许泄漏到业务内部
 */
public final class PaginationRule {

    private PaginationRule() {}

    /**
     * 生产代码中，只有 PaginationPolicy 可以调用 PageQuery.normalized(...)。
     */
    public static final ArchRule ONLY_PAGINATION_POLICY_CREATES_PAGE_QUERY =
        noClasses()
            .that().doNotHaveFullyQualifiedName(PaginationPolicy.class.getName())
            .should().callMethod(PageQuery.class, "normalized", int.class, int.class, List.class)
            .because("PageQuery 只表示归一化后的可信分页语义，必须由 PaginationPolicy 统一创建");

    /**
     * PageRequestDto 是 HTTP 边界输入对象，不允许泄漏到 web 之外。
     */
    public static final ArchRule PAGE_REQUEST_DTO_STAYS_IN_WEB_LAYER =
        noClasses()
            .that().resideOutsideOfPackage("..web..")
            .and().resideOutsideOfPackage("com.metabuild.infra.archunit..")
            .should().dependOnClassesThat().haveFullyQualifiedName("com.metabuild.infra.web.pagination.PageRequestDto")
            .because("PageRequestDto 只负责 HTTP 绑定，不得泄漏到 service / repository 等内部层");
}
