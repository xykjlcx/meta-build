package com.metabuild.admin.infra;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.infra.jooq.DataScopeVisitListener;
import com.metabuild.infra.jooq.SlowQueryListener;
import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 验证 jOOQ ExecuteListener 注册：SlowQueryListener 和 DataScopeVisitListener 必须同时生效。
 */
class JooqListenerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DSLContext dslContext;

    @Test
    void jooqShouldHaveBothExecuteListeners() {
        var providers = dslContext.configuration().executeListenerProviders();
        // 至少包含 SlowQueryListener 和 DataScopeVisitListener
        assertThat(providers.length).isGreaterThanOrEqualTo(2);
        var listenerTypes = Arrays.stream(providers)
            .map(p -> p.provide().getClass().getSimpleName())
            .toList();
        assertThat(listenerTypes).contains("SlowQueryListener", "DataScopeVisitListener");
    }
}
