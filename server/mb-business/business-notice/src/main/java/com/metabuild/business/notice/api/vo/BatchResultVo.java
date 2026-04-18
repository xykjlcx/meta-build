package com.metabuild.business.notice.api.vo;

import java.util.List;

/**
 * 批量操作结果 DTO。
 *
 * <p>每条独立事务，逐条执行，回传成功数 + 失败数 + 失败明细。
 * 失败明细包含原始 ID + errorCode + 可读消息，前端可逐条展示。
 */
public record BatchResultVo(
    int successCount,
    int failedCount,
    List<FailedItem> failures
) {
    /**
     * 单条失败明细。
     *
     * @param id        失败的实体 ID
     * @param errorCode i18n 错误码（如 notice.onlyDraftCanPublish）
     * @param message   异常 message（兜底信息）
     */
    public record FailedItem(Long id, String errorCode, String message) {}
}
