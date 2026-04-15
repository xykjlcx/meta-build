package com.metabuild.platform.log.web;

import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.web.pagination.PageRequestDto;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.log.api.dto.OperationLogView;
import com.metabuild.platform.log.domain.OperationLogService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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
    private final PaginationPolicy paginationPolicy;

    @GetMapping
    @RequirePermission("oplog:log:list")
    public PageResult<OperationLogView> list(@ParameterObject PageRequestDto request) {
        return service.list(paginationPolicy.normalize(request));
    }
}
