package com.metabuild.infra.observability;

import com.metabuild.common.security.CurrentUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 请求链路追踪：从 X-Trace-Id header 读取或自动生成 16 字符 traceId，写入 MDC + 响应头。
 * 同时在过滤链执行完成后（认证完毕），将 userId 写入 MDC 便于日志追踪。
 */
@RequiredArgsConstructor
public class TraceIdFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String MDC_TRACE_ID = "traceId";
    private static final String MDC_USER_ID = "userId";

    private final ObjectProvider<CurrentUser> currentUserProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put(MDC_TRACE_ID, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);
        try {
            filterChain.doFilter(request, response);
            // 过滤链执行后（认证框架已完成身份识别），将 userId 写入 MDC
            putUserIdToMdc();
        } finally {
            MDC.clear();
        }
    }

    /**
     * 将当前用户 ID 写入 MDC，未认证或获取失败时跳过（不写入）。
     */
    private void putUserIdToMdc() {
        try {
            CurrentUser user = currentUserProvider.getIfAvailable();
            if (user != null && user.isAuthenticated()) {
                MDC.put(MDC_USER_ID, String.valueOf(user.userId()));
            }
        } catch (Exception e) {
            // 获取用户信息失败不影响正常流程，静默跳过
        }
    }
}
