package com.metabuild.infra.async;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;
import org.springframework.core.task.TaskDecorator;

import java.util.List;

/**
 * 组合多个 TaskDecorator，按 {@link org.springframework.core.annotation.Order @Order} 顺序链式包裹。
 * 列表前面（Order 更小）的装饰器在最外层：最先捕获上下文、最后清理。
 *
 * <p>通过 {@link ObjectProvider} 延迟收集所有 TaskDecorator bean，首次 decorate 时解析一次并缓存，
 * 避免 AsyncConfig 早期初始化漏掉后注册的 decorator，也避免每次 decorate 扫全 bean context。
 */
public class CompositeTaskDecorator implements TaskDecorator {

    private final ObjectProvider<TaskDecorator> decoratorsProvider;
    private volatile List<TaskDecorator> cached;

    public CompositeTaskDecorator(ObjectProvider<TaskDecorator> decoratorsProvider) {
        this.decoratorsProvider = decoratorsProvider;
    }

    @Override
    public Runnable decorate(Runnable runnable) {
        List<TaskDecorator> decorators = resolveDecorators();
        Runnable wrapped = runnable;
        // 逆序包裹：Order 更小的在最外层（最先捕获、最后清理）
        for (int i = decorators.size() - 1; i >= 0; i--) {
            wrapped = decorators.get(i).decorate(wrapped);
        }
        return wrapped;
    }

    private List<TaskDecorator> resolveDecorators() {
        List<TaskDecorator> result = cached;
        if (result == null) {
            synchronized (this) {
                result = cached;
                if (result == null) {
                    result = decoratorsProvider.orderedStream()
                            .filter(d -> d != this)
                            .toList();
                    cached = result;
                }
            }
        }
        return result;
    }
}
