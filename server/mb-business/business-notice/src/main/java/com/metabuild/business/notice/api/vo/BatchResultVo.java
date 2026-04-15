package com.metabuild.business.notice.api.vo;

/**
 * 批量操作结果 DTO。
 */
public record BatchResultVo(
    int success,
    int skipped
) {}
