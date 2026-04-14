package com.metabuild.platform.dict.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建字典类型请求 DTO。
 */
public record DictTypeCreateRequest(
    @NotBlank @Size(max = 128) String name,
    @NotBlank @Size(max = 64) String code,
    @Size(max = 512) String remark
) {}
