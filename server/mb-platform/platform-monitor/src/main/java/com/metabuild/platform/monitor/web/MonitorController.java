package com.metabuild.platform.monitor.web;

import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.monitor.api.vo.ServerInfoVo;
import com.metabuild.platform.monitor.domain.MonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 服务监控 Controller（读 JVM/DB 实时指标）。
 */
@RestController
@RequestMapping("/api/v1/monitor")
@RequiredArgsConstructor
public class MonitorController {

    private final MonitorService monitorService;

    @GetMapping("/server-info")
    @RequirePermission("monitor:server:list")
    public ServerInfoVo serverInfo() {
        return monitorService.getServerInfo();
    }
}
