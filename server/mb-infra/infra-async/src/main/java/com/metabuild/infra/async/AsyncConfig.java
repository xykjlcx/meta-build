package com.metabuild.infra.async;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.beans.factory.ListableBeanFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步线程池配置：core=4, max=8, queue=200, CallerRunsPolicy。
 * 通过 BeanFactory 在 decorate 时实时收集所有 TaskDecorator bean（MDC + Sa-Token 等），
 * 组合为单个装饰器，避免早期初始化漏掉后注册的 decorator bean。
 */
@AutoConfiguration
@AutoConfigureBefore(TaskExecutionAutoConfiguration.class)
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    private final ListableBeanFactory beanFactory;

    public AsyncConfig(ListableBeanFactory beanFactory) {
        this.beanFactory = beanFactory;
    }

    @Bean
    public MdcTaskDecorator mdcTaskDecorator() {
        return new MdcTaskDecorator();
    }

    @Bean("mbAsyncExecutor")
    public ThreadPoolTaskExecutor mbAsyncExecutor() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("mb-async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        // 通过 BeanFactory 在 decorate 时实时解析所有 TaskDecorator bean
        executor.setTaskDecorator(new CompositeTaskDecorator(beanFactory));
        executor.initialize();
        log.info("异步线程池初始化完成（TaskDecorator 延迟解析）");
        return executor;
    }

    @Override
    public Executor getAsyncExecutor() {
        return mbAsyncExecutor();
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("异步任务异常 [{}]: {}", method.getName(), ex.getMessage(), ex);
    }
}
