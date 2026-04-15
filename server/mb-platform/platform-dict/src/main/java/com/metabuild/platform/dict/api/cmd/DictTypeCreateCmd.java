package com.metabuild.platform.dict.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建字典类型命令。
 */
public record DictTypeCreateCmd(
    @NotBlank @Size(max = 128) String name,
    @NotBlank @Size(max = 64) String code,
    @Size(max = 512) String remark
) {}
