package com.metabuild.infra.async;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.task.TaskDecorator;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 异步线程 MDC 上下文传递装饰器：将父线程的 MDC（如 traceId）复制到异步线程。
 *
 * <p>Order 低于 SaTokenTaskDecorator，确保 MDC 在最外层：登录态恢复前 traceId 已就位，
 * 所有日志包括 SaToken 内部日志都能带上 traceId。
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@Component
public class MdcTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        return () -> {
            if (contextMap != null) MDC.setContextMap(contextMap);
            try {
                runnable.run();
            } finally {
                MDC.clear();
            }
        };
    }
}
