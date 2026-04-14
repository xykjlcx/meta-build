package com.metabuild.infra.exception.web;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 分页配置属性：mb.api.pagination.default-size / mb.api.pagination.max-size。
 */
@ConfigurationProperties(prefix = "mb.api.pagination")
@Validated
public record MbPaginationProperties(
    int defaultSize,
    int maxSize
) {
    public MbPaginationProperties {
        if (defaultSize <= 0) defaultSize = 20;
        if (maxSize <= 0) maxSize = 200;
    }
}
