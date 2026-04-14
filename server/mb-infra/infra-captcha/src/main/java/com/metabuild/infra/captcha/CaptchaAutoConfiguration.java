package com.metabuild.infra.captcha;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * 验证码自动配置
 * <p>
 * 注册 {@link CaptchaService} 和 {@link CaptchaController}，
 * 通过 {@code mb.captcha.enabled=false} 可关闭验证码功能（开发/测试环境使用）。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbCaptchaProperties.class)
@ConditionalOnProperty(prefix = "mb.captcha", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CaptchaAutoConfiguration {

    /**
     * 注册验证码服务
     */
    @Bean
    public CaptchaService captchaService(StringRedisTemplate redisTemplate,
                                         MbCaptchaProperties props) {
        return new CaptchaService(redisTemplate, props);
    }

    /**
     * 注册验证码 Controller（公开接口，路径 /api/v1/public/captcha/**）
     */
    @Bean
    public CaptchaController captchaController(CaptchaService captchaService) {
        return new CaptchaController(captchaService);
    }
}
