package com.metabuild.business.notice.api;

/**
 * 批量操作结果 DTO。
 */
public record BatchResultView(
    int success,
    int skipped
) {}
