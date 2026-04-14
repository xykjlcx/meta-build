package com.metabuild.platform.dict.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 创建字典数据请求 DTO。
 */
public record DictDataCreateRequest(
    @NotNull Long dictTypeId,
    @NotBlank @Size(max = 128) String label,
    @NotBlank @Size(max = 128) String value,
    Integer sortOrder,
    @Size(max = 512) String remark
) {}
