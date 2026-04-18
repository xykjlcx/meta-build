package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;

/**
 * 定时任务规则：@Scheduled 必须同时标注 @SchedulerLock。
 *
 * <p>分布式环境下多实例并发执行同一 @Scheduled 任务会导致重复执行，
 * 必须配 @SchedulerLock 抢锁防止冲突。</p>
 *
 * <p>例外：infra-sse 的 SseHeartbeatScheduler 需要每个实例独立执行
 * （每个实例有自己的本地 SSE 连接注册表），加锁会破坏心跳功能。</p>
 */
public final class ScheduledRule {

    private ScheduledRule() {}

    public static final ArchRule SCHEDULED_METHOD_MUST_HAVE_SHEDLOCK =
        methods()
            .that().areAnnotatedWith("org.springframework.scheduling.annotation.Scheduled")
            .and().areNotDeclaredIn("com.metabuild.infra.sse.SseHeartbeatScheduler")
            .should().beAnnotatedWith("net.javacrumbs.shedlock.spring.annotation.SchedulerLock")
            .because("分布式环境下 @Scheduled 必须配 @SchedulerLock 防止多实例重复执行；"
                + "SseHeartbeatScheduler 因每个实例需独立维护本地 SSE 连接故豁免");
}
