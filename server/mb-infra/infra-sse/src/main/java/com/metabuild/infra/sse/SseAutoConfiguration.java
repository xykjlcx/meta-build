package com.metabuild.infra.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metabuild.common.security.CurrentUser;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * SSE 模块自动配置入口。
 *
 * <p>注册 SSE 连接管理、消息发送、心跳调度全部组件。
 * 注意：@EnableScheduling 由 platform-job 已声明，此处不重复声明。
 */
@AutoConfiguration
@EnableConfigurationProperties(SseProperties.class)
public class SseAutoConfiguration {

    @Bean
    public SseSessionRegistry sseSessionRegistry() {
        return new SseSessionRegistry();
    }

    @Bean
    public SseMessageSenderImpl sseMessageSender(
            SseSessionRegistry registry,
            ObjectMapper objectMapper,
            StringRedisTemplate redisTemplate) {
        return new SseMessageSenderImpl(registry, objectMapper, redisTemplate);
    }

    @Bean
    public SseHeartbeatScheduler sseHeartbeatScheduler(SseSessionRegistry registry) {
        return new SseHeartbeatScheduler(registry);
    }

    @Bean
    public SseConnectionController sseConnectionController(
            SseSessionRegistry registry,
            SseProperties properties,
            CurrentUser currentUser) {
        return new SseConnectionController(registry, properties, currentUser);
    }
}
