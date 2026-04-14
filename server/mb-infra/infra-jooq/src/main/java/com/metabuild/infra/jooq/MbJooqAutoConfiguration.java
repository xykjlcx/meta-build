package com.metabuild.infra.jooq;

import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.jooq.JooqAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(after = JooqAutoConfiguration.class)
@ConditionalOnClass(DefaultConfiguration.class)
@EnableConfigurationProperties({MbJooqProperties.class, MbIdProperties.class})
public class MbJooqAutoConfiguration {

    @Bean
    public SlowQueryListener slowQueryListener(MbJooqProperties props) {
        return new SlowQueryListener(props.slowQueryThresholdMs());
    }

    @Bean
    public DefaultExecuteListenerProvider slowQueryListenerProvider(SlowQueryListener listener) {
        return new DefaultExecuteListenerProvider(listener);
    }
}
