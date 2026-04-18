package com.metabuild.infra.async;

import org.springframework.beans.factory.ListableBeanFactory;
import org.springframework.core.task.TaskDecorator;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * 组合多个 TaskDecorator，按列表顺序链式包裹。
 * 列表前面的装饰器先捕获上下文、最后恢复；后面的装饰器在内层执行。
 *
 * <p>支持两种构造方式：
 * <ul>
 *   <li>固定列表：测试或显式装配场景。</li>
 *   <li>BeanFactory：每次 decorate 时实时查询所有 TaskDecorator bean，
 *       避免 AsyncConfig 早期初始化时漏掉后注册的 decorator。</li>
 * </ul>
 */
public class CompositeTaskDecorator implements TaskDecorator {

    private final ListableBeanFactory beanFactory;
    private final List<TaskDecorator> fixedDecorators;

    public CompositeTaskDecorator(ListableBeanFactory beanFactory) {
        this.beanFactory = Objects.requireNonNull(beanFactory, "beanFactory");
        this.fixedDecorators = null;
    }

    public CompositeTaskDecorator(List<TaskDecorator> decorators) {
        this.beanFactory = null;
        this.fixedDecorators = List.copyOf(Objects.requireNonNull(decorators, "decorators"));
    }

    @Override
    public Runnable decorate(Runnable runnable) {
        List<TaskDecorator> decorators = resolveDecorators();
        Runnable wrapped = runnable;
        // 逆序包裹：第一个装饰器在最外层（最先捕获、最后清理）
        for (int i = decorators.size() - 1; i >= 0; i--) {
            wrapped = decorators.get(i).decorate(wrapped);
        }
        return wrapped;
    }

    private List<TaskDecorator> resolveDecorators() {
        if (fixedDecorators != null) return fixedDecorators;
        var beans = beanFactory.getBeansOfType(TaskDecorator.class);
        List<TaskDecorator> result = new ArrayList<>(beans.size());
        for (TaskDecorator d : beans.values()) {
            if (d != this) result.add(d);
        }
        // 按类名排序，保证装饰器顺序稳定（MdcTaskDecorator 在 SaTokenTaskDecorator 之前）
        result.sort(Comparator.comparing(d -> d.getClass().getName()));
        return result;
    }
}
