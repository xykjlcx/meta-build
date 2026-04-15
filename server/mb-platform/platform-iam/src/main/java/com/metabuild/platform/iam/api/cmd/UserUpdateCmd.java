package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * 更新用户命令。
 */
public record UserUpdateCmd(
    @Email @Size(max = 255) String email,
    @Size(max = 32) String phone,
    @Size(max = 64) String nickname,
    @Size(max = 512) String avatar,
    Long deptId,
    Short status
) {}
