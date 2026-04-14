package com.metabuild.platform.file.api.dto;

import java.time.OffsetDateTime;

/**
 * 文件上传响应 DTO。
 */
public record FileUploadResponse(
    Long id,
    String originalName,
    String filePath,
    Long fileSize,
    String contentType,
    String sha256,
    OffsetDateTime createdAt
) {}
