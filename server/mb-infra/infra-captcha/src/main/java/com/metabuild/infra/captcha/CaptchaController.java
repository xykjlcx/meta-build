package com.metabuild.infra.captcha;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

/**
 * 验证码公开接口
 * <p>
 * 路径前缀 /api/v1/public/**，需在 auth 拦截器白名单中放行（不需要登录态）。
 * @ConditionalOnProperty 与 CaptchaAutoConfiguration 保持一致，
 * 确保 captcha.enabled=false 时组件扫描也不注册此 Controller。
 */
@RestController
@RequestMapping("/api/v1/public/captcha")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "mb.captcha", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CaptchaController {

    private final CaptchaService captchaService;

    /**
     * 生成验证码
     *
     * @return 包含 token 和 Base64 图片的验证码结果
     */
    @GetMapping("/generate")
    public CaptchaService.CaptchaResult generate() {
        return captchaService.generate();
    }

    // verify 端点已删除：验证码校验由 AuthService.login() 内部调用 CaptchaService.verify()，
    // 不暴露独立端点，避免攻击者批量试码。
}
