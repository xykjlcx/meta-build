package com.metabuild.infra.jooq;

import org.jooq.ExecuteContext;
import org.jooq.impl.DefaultExecuteListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 慢查询监听器：超过阈值的 SQL 打 WARN 日志。
 */
public class SlowQueryListener extends DefaultExecuteListener {

    private static final Logger log = LoggerFactory.getLogger(SlowQueryListener.class);

    private final long thresholdMs;

    public SlowQueryListener(long thresholdMs) {
        this.thresholdMs = thresholdMs;
    }

    @Override
    public void executeStart(ExecuteContext ctx) {
        ctx.data("startTime", System.nanoTime());
    }

    @Override
    public void executeEnd(ExecuteContext ctx) {
        Long startTime = (Long) ctx.data("startTime");
        if (startTime == null) return;

        long durationMs = (System.nanoTime() - startTime) / 1_000_000;
        if (durationMs >= thresholdMs) {
            log.warn("慢查询 [{}ms]: {}", durationMs, ctx.query());
        }
    }
}
