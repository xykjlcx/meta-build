package com.metabuild.infra.jooq;

import com.metabuild.common.id.SnowflakeIdGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IdGeneratorConfig {

    @Bean
    public SnowflakeIdGenerator snowflakeIdGenerator(MbIdProperties idProperties) {
        return new SnowflakeIdGenerator(idProperties.worker(), idProperties.datacenter());
    }
}
