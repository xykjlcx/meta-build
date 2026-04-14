package com.metabuild.infra.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 基于 Bucket4j 的限流拦截器
 * <p>
 * 实现两级限流：
 * 1. 接口级限流：方法上有 {@code @RateLimit} 注解时，使用注解指定的 QPS
 * 2. IP 级限流：所有请求按客户端 IP 限流（使用 {@code mb.rate-limit.perIpQps}）
 * <p>
 * 超出限流阈值时返回 HTTP 429 Too Many Requests。
 * 使用内存 ConcurrentHashMap 存储 Bucket，适合单实例部署（v1 阶段）。
 */
@Slf4j
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final MbRateLimitProperties props;

    /** 按 IP + 方法 key 存储的令牌桶 */
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws Exception {
        // 未启用限流时直接放行
        if (!props.enabled()) {
            return true;
        }
        // 非 Controller 方法处理器直接放行（如静态资源）
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        String clientIp = resolveClientIp(request);
        RateLimit annotation = handlerMethod.getMethodAnnotation(RateLimit.class);

        // 决定本次限流的 QPS
        int qps;
        String bucketKey;
        if (annotation != null && annotation.qps() > 0) {
            // 注解指定了具体 QPS
            qps = annotation.qps();
            bucketKey = annotation.key().isBlank()
                    ? buildMethodKey(handlerMethod)
                    : annotation.key();
        } else if (annotation != null) {
            // 注解存在但 qps=0，使用全局默认
            qps = props.globalQps();
            bucketKey = annotation.key().isBlank()
                    ? buildMethodKey(handlerMethod)
                    : annotation.key();
        } else {
            // 无注解，按 IP 限流
            qps = props.perIpQps();
            bucketKey = "ip:" + clientIp;
        }

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> buildBucket(qps));

        if (bucket.tryConsume(1)) {
            return true;
        }

        log.warn("限流触发: key={}, ip={}, path={}", bucketKey, clientIp, request.getRequestURI());
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"Too Many Requests\",\"status\":429}");
        return false;
    }

    /**
     * 构建令牌桶：平滑补充速率 + 突发容量
     */
    private Bucket buildBucket(int qps) {
        Bandwidth limit = Bandwidth.classic(
                props.burstCapacity() + qps,
                Refill.greedy(qps, Duration.ofSeconds(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * 构建方法维度的限流 key（类名 + 方法名）
     */
    private String buildMethodKey(HandlerMethod handlerMethod) {
        return handlerMethod.getBeanType().getSimpleName() + "." + handlerMethod.getMethod().getName();
    }

    /**
     * 解析客户端真实 IP（兼容反向代理）
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // 取第一个 IP（最原始客户端）
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
