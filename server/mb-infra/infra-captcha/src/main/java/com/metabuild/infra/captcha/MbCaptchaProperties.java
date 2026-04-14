package com.metabuild.infra.captcha;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 验证码配置属性
 * <p>
 * 配置前缀：mb.captcha
 * 默认生成 4 位数字文字验证码，有效期 5 分钟，图片尺寸 300x150。
 *
 * <p>使用 {@code Boolean}（包装类型）而非 {@code boolean}，
 * 以便在 compact constructor 中将 null（未配置）默认为 true。
 */
@ConfigurationProperties(prefix = "mb.captcha")
@Validated
public record MbCaptchaProperties(
        Boolean enabled,
        int expireSeconds,
        int tolerancePx,
        int width,
        int height
) {
    public MbCaptchaProperties {
        if (enabled == null) enabled = true;
        if (expireSeconds <= 0) expireSeconds = 300;
        if (tolerancePx <= 0) tolerancePx = 5;
        if (width <= 0) width = 300;
        if (height <= 0) height = 150;
    }
}
