package com.metabuild.platform.oplog.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.oplog.api.dto.OperationLogResponse;
import com.metabuild.platform.oplog.domain.OperationLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 操作日志查询接口（追加表，仅支持查询）。
 */
@RestController
@RequestMapping("/api/v1/oplog")
@RequiredArgsConstructor
public class OperationLogController {

    private final OperationLogService service;

    @GetMapping
    @RequirePermission("oplog:log:list")
    public PageResult<OperationLogResponse> list(PageQuery query) {
        return service.list(query);
    }
}
