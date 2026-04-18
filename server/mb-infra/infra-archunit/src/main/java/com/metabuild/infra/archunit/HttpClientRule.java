package com.metabuild.infra.archunit;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaConstructorCall;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * HTTP 客户端规则：禁止 new RestTemplate()。
 *
 * <p>RestTemplate 必须通过 infra-web 提供的共享 Bean 注入，
 * 避免每次 new 都创建新连接池导致 socket 耗尽。
 * 仅 RestTemplateAutoConfiguration 作为装配类豁免。</p>
 */
public final class HttpClientRule {

    private HttpClientRule() {}

    private static final String REST_TEMPLATE_FQN = "org.springframework.web.client.RestTemplate";

    public static final ArchRule NO_DIRECT_REST_TEMPLATE_CONSTRUCTION =
        noClasses()
            .that().doNotHaveSimpleName("RestTemplateAutoConfiguration")
            .should().callConstructorWhere(targetOwnerIs(REST_TEMPLATE_FQN))
            .because("RestTemplate 必须通过 infra-web 提供的共享 Bean 注入，禁止 new RestTemplate()");

    private static DescribedPredicate<JavaConstructorCall> targetOwnerIs(String fqn) {
        return new DescribedPredicate<>("target type is " + fqn) {
            @Override
            public boolean test(JavaConstructorCall call) {
                return call.getTargetOwner().getFullName().equals(fqn);
            }
        };
    }
}
