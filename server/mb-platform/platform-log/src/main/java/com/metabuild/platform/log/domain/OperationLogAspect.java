package com.metabuild.platform.log.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.log.OperationLog;
import com.metabuild.schema.tables.records.MbLogOperationRecord;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.OffsetDateTime;

/**
 * 操作日志 AOP 切面。
 * 拦截标注了 @OperationLog 的 Controller 方法，记录请求/响应/耗时/异常信息。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogWriter writer;
    private final CurrentUser currentUser;
    private final ObjectMapper objectMapper;
    private final java.time.Clock clock;

    @Around("@annotation(operationLog)")
    public Object around(ProceedingJoinPoint joinPoint, OperationLog operationLog) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        // 请求上下文
        HttpServletRequest request = null;
        String requestUrl = null;
        String method = null;
        String ip = null;
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            request = attrs.getRequest();
            requestUrl = request.getRequestURI();
            method = request.getMethod();
            ip = getClientIp(request);
        }

        // 请求参数序列化（截断防止过大）
        String requestParams = serializeArgs(joinPoint.getArgs());

        Object result = null;
        boolean success = true;
        String errorMessage = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable ex) {
            success = false;
            errorMessage = ex.getMessage();
            throw ex;
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            writeLog(operationLog, methodName, requestUrl, method, ip,
                requestParams, result, success, errorMessage, durationMs);
        }
    }

    private void writeLog(OperationLog operationLog, String methodName,
                          String requestUrl, String httpMethod, String ip,
                          String requestParams, Object result,
                          boolean success, String errorMessage, long durationMs) {
        try {
            MbLogOperationRecord record = new MbLogOperationRecord();

            // 用户信息（未登录时使用默认值）
            if (currentUser.isAuthenticated()) {
                record.setUserId(currentUser.userId());
                record.setUsername(currentUser.username());
                record.setTenantId(currentUser.tenantId());
            } else {
                record.setUserId(null);
                record.setUsername("anonymous");
                record.setTenantId(0L);
            }

            record.setModule(operationLog.module());
            record.setOperation(operationLog.operation());
            record.setMethod(methodName);
            record.setRequestUrl(requestUrl);
            record.setRequestParams(truncate(requestParams, 2000));
            record.setIp(ip);
            record.setDurationMs(durationMs);
            record.setSuccess(success);
            record.setErrorMessage(truncate(errorMessage, 500));
            record.setCreatedAt(OffsetDateTime.now(clock));

            // 响应结果序列化（截断）
            if (result != null && success) {
                try {
                    String responseStr = objectMapper.writeValueAsString(result);
                    record.setResponseResult(truncate(responseStr, 2000));
                } catch (JsonProcessingException ignored) {
                    record.setResponseResult("[序列化失败]");
                }
            }

            writer.writeAsync(record);
        } catch (Exception e) {
            log.warn("构建操作日志记录失败: {}", e.getMessage());
        }
    }

    private String serializeArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(args);
        } catch (JsonProcessingException e) {
            return "[序列化失败]";
        }
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return null;
        return value.length() > maxLen ? value.substring(0, maxLen) + "..." : value;
    }

    /**
     * 获取客户端 IP。
     * 项目已配置 server.forward-headers-strategy: FRAMEWORK，
     * ForwardedHeaderFilter 会将真实 IP 写入 remoteAddr，无需手动读 XFF。
     */
    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
