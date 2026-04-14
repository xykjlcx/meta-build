package com.metabuild.platform.file.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * 文件模块配置属性。
 *
 * <pre>
 * mb:
 *   file:
 *     storage-path: /data/files
 *     max-size-mb: 50
 *     allowed-types:
 *       - image/jpeg
 *       - image/png
 *       - application/pdf
 * </pre>
 */
@ConfigurationProperties(prefix = "mb.file")
@Validated
public record MbFileProperties(
    String storagePath,
    int maxSizeMb,
    List<String> allowedTypes
) {
    public MbFileProperties {
        if (storagePath == null || storagePath.isBlank()) {
            storagePath = System.getProperty("java.io.tmpdir") + "/mb-files";
        }
        if (maxSizeMb <= 0) {
            maxSizeMb = 50;
        }
        if (allowedTypes == null || allowedTypes.isEmpty()) {
            allowedTypes = List.of(
                "image/jpeg", "image/png", "image/gif", "image/webp",
                "application/pdf",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain", "text/csv"
            );
        }
    }
}
