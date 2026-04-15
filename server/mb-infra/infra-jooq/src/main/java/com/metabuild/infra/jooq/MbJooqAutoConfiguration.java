package com.metabuild.infra.jooq;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.jooq.audit.AuditFieldsRecordListener;
import com.metabuild.infra.jooq.datascope.BypassDataScopeAspect;
import com.metabuild.infra.jooq.datascope.DataScopeRegistry;
import com.metabuild.infra.jooq.datascope.DataScopeVisitListener;
import com.metabuild.infra.jooq.id.MbIdProperties;
import com.metabuild.infra.jooq.query.SlowQueryListener;
import org.jooq.ExecuteListenerProvider;
import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.jooq.impl.DefaultRecordListenerProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.jooq.DefaultConfigurationCustomizer;
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

    // ---- 慢查询监控 ----

    @Bean
    public SlowQueryListener slowQueryListener(MbJooqProperties props) {
        return new SlowQueryListener(props.slowQueryThresholdMs());
    }

    /**
     * 将 SlowQueryListener 注册为独立的 ExecuteListenerProvider Bean。
     * Spring Boot 的 JooqAutoConfiguration 会自动收集所有 ExecuteListenerProvider Bean。
     */
    @Bean
    public ExecuteListenerProvider slowQueryListenerProvider(SlowQueryListener listener) {
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
     * 数据权限 SQL 拦截器：在 renderStart 阶段（SQL 渲染前）注入部门过滤条件。
     *
     * <p>使用 ExecuteListener 而非 VisitListener，因为 ExecuteListener.renderStart() 在
     * SQL 字符串生成前触发，addConditions() 此时可有效影响 PreparedStatement 的 SQL 内容。
     * VisitListener 的 clauseEnd 触发时 SQL 可能已渲染，addConditions() 无法影响已生成的 SQL。
     */
    @Bean
    public DataScopeVisitListener dataScopeExecuteListener(
            DataScopeRegistry registry,
            ObjectProvider<CurrentUser> currentUserProvider) {
        return new DataScopeVisitListener(registry, currentUserProvider);
    }

    /**
     * 将 DataScopeExecuteListener 注册为独立的 ExecuteListenerProvider Bean。
     */
    @Bean
    public ExecuteListenerProvider dataScopeListenerProvider(DataScopeVisitListener listener) {
        return new DefaultExecuteListenerProvider(listener);
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
     * 将 AuditFieldsRecordListener 注册到 jOOQ Configuration。
     *
     * <p>Spring Boot 的 JooqAutoConfiguration 不自动处理 RecordListenerProvider，
     * 必须通过 DefaultConfigurationCustomizer 手动注册。
     */
    @Bean
    public DefaultConfigurationCustomizer auditFieldsRecordListenerCustomizer(AuditFieldsRecordListener listener) {
        return config -> config.set(new DefaultRecordListenerProvider(listener));
    }
}
