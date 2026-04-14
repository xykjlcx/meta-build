package com.metabuild.infra.captcha;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * 验证码自动配置
 * <p>
 * 通过 {@code mb.captcha.enabled=false} 可关闭验证码功能（开发/测试环境使用）。
 * 禁用时注册 no-op {@link CaptchaService} 存根，使依赖方（AuthService）无需感知功能开关。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbCaptchaProperties.class)
public class CaptchaAutoConfiguration {

    /**
     * 验证码功能启用时：注册真实验证码服务（Redis + 图片生成）
     */
    @Bean
    @ConditionalOnProperty(prefix = "mb.captcha", name = "enabled", havingValue = "true", matchIfMissing = true)
    public CaptchaService captchaService(StringRedisTemplate redisTemplate,
                                         MbCaptchaProperties props) {
        return new CaptchaService(redisTemplate, props);
    }

    /**
     * 验证码功能禁用时：注册 no-op 存根，verify 永远返回 true
     * （AuthService 中 failCount 达到阈值才调用 verify，禁用状态下不会走到此逻辑）
     */
    @Bean
    @ConditionalOnProperty(prefix = "mb.captcha", name = "enabled", havingValue = "false")
    public CaptchaService captchaServiceStub() {
        return new CaptchaService(null, null) {
            @Override
            public CaptchaResult generate() {
                throw new UnsupportedOperationException("验证码功能已禁用");
            }

            @Override
            public boolean verify(String token, String code) {
                // 禁用状态下验证码校验恒返回 true（不应到达此处）
                return true;
            }
        };
    }
}
