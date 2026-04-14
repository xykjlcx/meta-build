package com.metabuild.platform.monitor.domain;

import com.metabuild.platform.monitor.api.dto.ServerInfoResponse;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.ThreadMXBean;

/**
 * 服务监控业务服务。
 * 从 MeterRegistry（Micrometer）和 JVM MXBean 读取实时指标，无独立存储表。
 */
@Service
@RequiredArgsConstructor
public class MonitorService {

    private final MeterRegistry meterRegistry;

    /**
     * 读取服务器实时信息（JVM 内存 + CPU + 线程 + DB 连接池）。
     */
    public ServerInfoResponse getServerInfo() {
        return new ServerInfoResponse(
            buildJvmMemory(),
            buildCpuInfo(),
            buildThreadInfo(),
            buildDbInfo()
        );
    }

    private ServerInfoResponse.JvmMemory buildJvmMemory() {
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        long heapUsed = memoryMXBean.getHeapMemoryUsage().getUsed();
        long heapMax = memoryMXBean.getHeapMemoryUsage().getMax();
        long nonHeapUsed = memoryMXBean.getNonHeapMemoryUsage().getUsed();

        return new ServerInfoResponse.JvmMemory(
            heapUsed / (1024 * 1024),
            heapMax / (1024 * 1024),
            nonHeapUsed / (1024 * 1024)
        );
    }

    private ServerInfoResponse.CpuInfo buildCpuInfo() {
        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();
        double cpuUsage = -1.0;
        if (os instanceof com.sun.management.OperatingSystemMXBean sunOs) {
            cpuUsage = sunOs.getProcessCpuLoad();
        }
        return new ServerInfoResponse.CpuInfo(
            os.getAvailableProcessors(),
            cpuUsage
        );
    }

    private ServerInfoResponse.ThreadInfo buildThreadInfo() {
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
        return new ServerInfoResponse.ThreadInfo(
            threadMXBean.getThreadCount(),
            threadMXBean.getDaemonThreadCount()
        );
    }

    private ServerInfoResponse.DbInfo buildDbInfo() {
        // 从 Micrometer 读取 HikariCP 连接池指标（HikariCP 自动注册到 MeterRegistry）
        double active = getGaugeValue("hikaricp.connections.active", 0.0);
        double pending = getGaugeValue("hikaricp.connections.pending", 0.0);
        double max = getGaugeValue("hikaricp.connections.max", 0.0);

        return new ServerInfoResponse.DbInfo(active, pending, max);
    }

    private double getGaugeValue(String metricName, double defaultValue) {
        Gauge gauge = meterRegistry.find(metricName).gauge();
        return gauge != null ? gauge.value() : defaultValue;
    }
}
