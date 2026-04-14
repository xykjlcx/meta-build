package com.metabuild.platform.monitor.api.dto;

/**
 * 服务器信息视图 DTO（JVM + 系统指标，只读，供响应使用）。
 */
public record ServerInfoView(
    JvmMemory jvmMemory,
    CpuInfo cpu,
    ThreadInfo threads,
    DbInfo db
) {

    /** JVM 内存信息（单位：MB） */
    public record JvmMemory(
        long heapUsedMb,
        long heapMaxMb,
        long nonHeapUsedMb
    ) {}

    /** CPU 信息 */
    public record CpuInfo(
        int availableProcessors,
        double processCpuUsage
    ) {}

    /** 线程信息 */
    public record ThreadInfo(
        int liveThreads,
        int daemonThreads
    ) {}

    /** 数据库连接池信息 */
    public record DbInfo(
        double activeConnections,
        double pendingConnections,
        double maxConnections
    ) {}
}
