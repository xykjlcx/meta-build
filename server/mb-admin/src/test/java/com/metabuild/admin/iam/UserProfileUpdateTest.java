package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.platform.iam.api.cmd.ProfileUpdateCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.api.vo.UserVo;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * C1 PUT /users/me 集成测试。
 */
@Import(TestSecurityConfig.class)
class UserProfileUpdateTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;

    @Test
    void updateMyProfile_should_update_allowed_fields() {
        Long id = userService.createUser(new UserCreateCmd("profileuser1", "Test@12345", "p1@example.com", null, "原昵称", null));

        UserVo updated = userService.updateMyProfile(id, new ProfileUpdateCmd(
            "新昵称", "new@example.com", "13800138000", "https://cdn/a.png"
        ));

        assertThat(updated.nickname()).isEqualTo("新昵称");
        assertThat(updated.email()).isEqualTo("new@example.com");
        assertThat(updated.phone()).isEqualTo("13800138000");
        assertThat(updated.avatar()).isEqualTo("https://cdn/a.png");
    }

    @Test
    void updateMyProfile_should_reject_duplicate_email() {
        Long u1 = userService.createUser(new UserCreateCmd("existemailu1", "Test@12345", "exist@example.com", null, null, null));
        Long u2 = userService.createUser(new UserCreateCmd("existemailu2", "Test@12345", "other@example.com", null, null, null));

        assertThatThrownBy(() -> userService.updateMyProfile(u2, new ProfileUpdateCmd(
            null, "exist@example.com", null, null
        )))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("iam.user.emailDuplicate");
    }

    @Test
    void updateMyProfile_should_allow_keeping_same_email() {
        Long id = userService.createUser(new UserCreateCmd("keepuser", "Test@12345", "keep@example.com", null, null, null));

        // 改其他字段但 email 不变 → 不应触发唯一性冲突
        UserVo updated = userService.updateMyProfile(id, new ProfileUpdateCmd(
            "保持邮箱", "keep@example.com", null, null
        ));
        assertThat(updated.email()).isEqualTo("keep@example.com");
        assertThat(updated.nickname()).isEqualTo("保持邮箱");
    }

    @Test
    void updateMyProfile_should_skip_null_fields() {
        Long id = userService.createUser(new UserCreateCmd("skipuser", "Test@12345", "skip@example.com", "13000000000", "原昵称", null));

        // 只改 nickname，其他 null 应保留原值
        UserVo updated = userService.updateMyProfile(id, new ProfileUpdateCmd(
            "只改昵称", null, null, null
        ));
        assertThat(updated.nickname()).isEqualTo("只改昵称");
        assertThat(updated.email()).isEqualTo("skip@example.com");
        assertThat(updated.phone()).isEqualTo("13000000000");
    }
}
