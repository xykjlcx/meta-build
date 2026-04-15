package com.metabuild.platform.log.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.platform.log.api.vo.OperationLogVo;
import com.metabuild.schema.tables.records.MbLogOperationRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 操作日志业务服务（仅查询，追加表无写业务方法）。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationLogService {

    private final OperationLogRepository repository;

    /**
     * 分页查询操作日志列表。
     */
    public PageResult<OperationLogVo> list(PageQuery query) {
        return repository.findPage(query).map(this::toResponse);
    }

    private OperationLogVo toResponse(MbLogOperationRecord r) {
        return new OperationLogVo(
            r.getId(),
            r.getUserId(),
            r.getUsername(),
            r.getModule(),
            r.getOperation(),
            r.getMethod(),
            r.getRequestUrl(),
            r.getIp(),
            r.getDurationMs(),
            r.getSuccess(),
            r.getErrorMessage(),
            r.getCreatedAt()
        );
    }
}
