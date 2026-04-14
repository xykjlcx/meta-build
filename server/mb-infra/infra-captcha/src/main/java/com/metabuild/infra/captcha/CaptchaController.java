package com.metabuild.infra.captcha;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    /**
     * 验证验证码
     *
     * @param request 包含 token 和用户输入 code 的请求体
     * @return {"valid": true/false}
     */
    @PostMapping("/verify")
    public Map<String, Boolean> verify(@RequestBody CaptchaVerifyRequest request) {
        boolean valid = captchaService.verify(request.token(), request.code());
        return Map.of("valid", valid);
    }

    /**
     * 验证码校验请求
     *
     * @param token 验证码 token（生成时返回）
     * @param code  用户输入的验证码
     */
    public record CaptchaVerifyRequest(String token, String code) {
    }
}
