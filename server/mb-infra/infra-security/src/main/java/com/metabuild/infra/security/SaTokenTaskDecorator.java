package com.metabuild.infra.security;

import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.context.SaTokenContextForThreadLocalStorage;
import cn.dev33.satoken.context.model.SaRequest;
import cn.dev33.satoken.context.model.SaResponse;
import cn.dev33.satoken.context.model.SaStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.core.task.TaskDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/**
 * 将父线程的 Sa-Token 登录上下文 + Spring Web RequestAttributes 传递到 @Async 子线程。
 *
 * <p>传递 Sa-Token 的 SaRequest/SaResponse/SaStorage 三件套到 ThreadLocal 存储，
 * Sa-Token 在当前线程缺失主上下文时会自动从 {@link SaTokenContextForThreadLocalStorage} 读取。
 *
 * <p>同时传递 Spring {@link RequestContextHolder}，保证 @RequestScope 代理的 bean
 * （如 SaTokenCurrentUser）在子线程中仍可解析。
 *
 * <p>Order 晚于 MdcTaskDecorator：MDC 先恢复，Sa-Token 后恢复（SaToken 内部日志能带 traceId）。
 */
@Order(100)
@Component
public class SaTokenTaskDecorator implements TaskDecorator {

    private static final Logger log = LoggerFactory.getLogger(SaTokenTaskDecorator.class);

    @Override
    public Runnable decorate(Runnable runnable) {
        SaRequest request;
        SaResponse response;
        SaStorage storage;
        try {
            request = SaHolder.getRequest();
            response = SaHolder.getResponse();
            storage = SaHolder.getStorage();
        } catch (Exception e) {
            // 父线程无 web 上下文（如定时任务触发的异步调用），跳过传递
            log.debug("Sa-Token 上下文捕获跳过（父线程无 web 上下文）: {}", e.getMessage());
            request = null;
            response = null;
            storage = null;
        }
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();

        final SaRequest capturedRequest = request;
        final SaResponse capturedResponse = response;
        final SaStorage capturedStorage = storage;

        return () -> {
            boolean saBoxSet = false;
            boolean attrsSet = false;
            try {
                if (capturedRequest != null && capturedResponse != null && capturedStorage != null) {
                    SaTokenContextForThreadLocalStorage.setBox(capturedRequest, capturedResponse, capturedStorage);
                    saBoxSet = true;
                }
                if (attributes != null) {
                    RequestContextHolder.setRequestAttributes(attributes);
                    attrsSet = true;
                }
                runnable.run();
            } finally {
                if (saBoxSet) {
                    SaTokenContextForThreadLocalStorage.clearBox();
                }
                if (attrsSet) {
                    RequestContextHolder.resetRequestAttributes();
                }
            }
        };
    }
}
