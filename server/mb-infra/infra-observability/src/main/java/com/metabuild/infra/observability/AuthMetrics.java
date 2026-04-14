package com.metabuild.infra.observability;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;

/**
 * 认证业务指标：记录登录成功/失败计数器。
 *
 * <p>指标示例：
 * <ul>
 *   <li>{@code mb.auth.login{result="success"}} — 登录成功次数</li>
 *   <li>{@code mb.auth.login{result="failure", reason="badCredentials"}} — 登录失败次数</li>
 * </ul>
 *
 * <p>在 infra-security 的登录处理器中注入此 Bean 并调用对应方法。
 */
@RequiredArgsConstructor
public class AuthMetrics {

    private final MeterRegistry registry;

    /**
     * 记录一次登录成功事件。
     */
    public void loginSuccess() {
        registry.counter("mb.auth.login", "result", "success").increment();
    }

    /**
     * 记录一次登录失败事件。
     *
     * @param reason 失败原因（如 "badCredentials"、"accountLocked"、"captchaError"）
     */
    public void loginFailure(String reason) {
        registry.counter("mb.auth.login", "result", "failure", "reason", reason).increment();
    }
}
