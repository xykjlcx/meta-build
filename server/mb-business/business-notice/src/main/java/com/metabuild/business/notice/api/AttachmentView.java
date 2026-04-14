package com.metabuild.business.notice.api;

/**
 * 公告附件视图 DTO（含文件元数据）。
 */
public record AttachmentView(
    Long fileId,
    String fileName,
    Long fileSize,
    String filePath,
    Integer sortOrder
) {}
