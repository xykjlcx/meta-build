package com.metabuild.infra.jooq;

import com.metabuild.common.security.CurrentUser;
import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.jooq.impl.DefaultRecordListenerProvider;
import org.jooq.impl.DefaultVisitListenerProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.jooq.JooqAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

import java.time.Clock;

@AutoConfiguration(after = JooqAutoConfiguration.class)
@ConditionalOnClass(DefaultConfiguration.class)
@EnableConfigurationProperties({MbJooqProperties.class, MbIdProperties.class})
@EnableAspectJAutoProxy
public class MbJooqAutoConfiguration {

    // ---- 已有 Bean ----

    @Bean
    public SlowQueryListener slowQueryListener(MbJooqProperties props) {
        return new SlowQueryListener(props.slowQueryThresholdMs());
    }

    @Bean
    public DefaultExecuteListenerProvider slowQueryListenerProvider(SlowQueryListener listener) {
        return new DefaultExecuteListenerProvider(listener);
    }

    // ---- 数据权限 ----

    /**
     * 数据权限注册表：业务模块调用 register() 声明需要过滤的表。
     */
    @Bean
    public DataScopeRegistry dataScopeRegistry() {
        return new DataScopeRegistry();
    }

    /**
     * 数据权限 SQL 拦截器：在 SELECT 构建阶段注入部门过滤条件。
     */
    @Bean
    public DataScopeVisitListener dataScopeVisitListener(
            DataScopeRegistry registry,
            ObjectProvider<CurrentUser> currentUserProvider) {
        return new DataScopeVisitListener(registry, currentUserProvider);
    }

    /**
     * 将 DataScopeVisitListener 注册到 jOOQ VisitListener 链。
     */
    @Bean
    public DefaultVisitListenerProvider dataScopeVisitListenerProvider(DataScopeVisitListener listener) {
        return new DefaultVisitListenerProvider(listener);
    }

    /**
     * @BypassDataScope 切面：通过 ThreadLocal 标记跳过数据权限过滤。
     */
    @Bean
    public BypassDataScopeAspect bypassDataScopeAspect() {
        return new BypassDataScopeAspect();
    }

    // ---- 审计字段 ----

    /**
     * 审计字段自动填充：INSERT/UPDATE 时自动写入 created_by / updated_by / *_at。
     */
    @Bean
    public AuditFieldsRecordListener auditFieldsRecordListener(
            ObjectProvider<CurrentUser> currentUserProvider,
            ObjectProvider<Clock> clockProvider) {
        return new AuditFieldsRecordListener(currentUserProvider, clockProvider);
    }

    /**
     * 将 AuditFieldsRecordListener 注册到 jOOQ RecordListener 链。
     */
    @Bean
    public DefaultRecordListenerProvider auditFieldsRecordListenerProvider(AuditFieldsRecordListener listener) {
        return new DefaultRecordListenerProvider(listener);
    }
}
