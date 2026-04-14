package com.metabuild.platform.file.api.dto;

import java.time.OffsetDateTime;

/**
 * 文件上传视图 DTO（只读，供响应使用）。
 */
public record FileUploadView(
    Long id,
    String originalName,
    String filePath,
    Long fileSize,
    String contentType,
    String sha256,
    OffsetDateTime createdAt
) {}
