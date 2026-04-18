package com.metabuild.infra.async;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步线程池配置：core=4, max=8, queue=200, CallerRunsPolicy。
 * 通过 ObjectProvider 注入所有 TaskDecorator，首次 decorate 时懒加载 + 缓存，
 * 按 @Order 链式包裹（MdcTaskDecorator 在外、SaTokenTaskDecorator 在内）。
 */
@AutoConfiguration
@AutoConfigureBefore(TaskExecutionAutoConfiguration.class)
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    private final ObjectProvider<TaskDecorator> taskDecorators;

    public AsyncConfig(ObjectProvider<TaskDecorator> taskDecorators) {
        this.taskDecorators = taskDecorators;
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
        executor.setTaskDecorator(new CompositeTaskDecorator(taskDecorators));
        executor.initialize();
        log.info("异步线程池初始化完成（TaskDecorator @Order 链式装配，懒加载 + 缓存）");
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
