package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * 当前用户 Profile 更新命令（PUT /users/me）。
 *
 * <p>仅允许自己修改 nickname / email / phone / avatar；
 * username / deptId / status 由管理员操作，不在此处暴露。
 */
public record ProfileUpdateCmd(
    @Size(max = 64) String nickname,
    @Email @Size(max = 255) String email,
    @Size(max = 32) String phone,
    @Size(max = 512) String avatar
) {}
