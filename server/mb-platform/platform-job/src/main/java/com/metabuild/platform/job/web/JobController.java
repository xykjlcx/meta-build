package com.metabuild.platform.job.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.job.api.dto.JobLogView;
import com.metabuild.platform.job.domain.JobLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 定时任务日志查询接口。
 */
@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobLogService jobLogService;

    @GetMapping("/logs")
    @RequirePermission("job:log:list")
    public PageResult<JobLogView> listLogs(PageQuery query) {
        return jobLogService.list(query);
    }
}
