package com.metabuild.infra.async;

import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;

import java.util.Map;

/**
 * 异步线程 MDC 上下文传递装饰器：将父线程的 MDC（如 traceId）复制到异步线程。
 */
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
