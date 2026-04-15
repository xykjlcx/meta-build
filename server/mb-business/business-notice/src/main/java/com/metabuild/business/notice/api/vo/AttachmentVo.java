package com.metabuild.business.notice.api.vo;

/**
 * 公告附件视图 DTO（含文件元数据）。
 */
public record AttachmentVo(
    Long fileId,
    String fileName,
    Long fileSize,
    String filePath,
    Integer sortOrder
) {}
