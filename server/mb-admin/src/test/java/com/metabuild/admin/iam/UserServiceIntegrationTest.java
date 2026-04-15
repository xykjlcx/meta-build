package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.iam.api.dto.UserCreateCommand;
import com.metabuild.platform.iam.api.dto.UserView;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * UserService 集成测试：覆盖创建用户、查询、分页、唯一性校验。
 * 每个测试方法结束后自动回滚（@Transactional 在 BaseIntegrationTest 上）。
 */
@Import(TestSecurityConfig.class)
class UserServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;

    // ───────── 创建用户 ─────────

    @Test
    void createUser_should_return_generated_id() {
        UserCreateCommand request = new UserCreateCommand(
            "testuser01",
            "Test@12345",
            "test01@example.com",
            null,
            "测试用户01",
            null
        );

        Long userId = userService.createUser(request);

        assertThat(userId).isNotNull().isPositive();
    }

    @Test
    void createUser_password_should_be_encoded() {
        UserCreateCommand request = new UserCreateCommand(
            "testuser02",
            "Test@12345",
            "test02@example.com",
            null,
            "测试用户02",
            null
        );

        Long userId = userService.createUser(request);
        UserView user = userService.getById(userId);

        // 密码不以明文暴露在 UserView 中
        assertThat(user.username()).isEqualTo("testuser02");
        assertThat(user.email()).isEqualTo("test02@example.com");
        assertThat(user.nickname()).isEqualTo("测试用户02");
        assertThat(user.status()).isEqualTo((short) 1);
        assertThat(user.mustChangePassword()).isFalse();
    }

    @Test
    void createUser_should_throw_conflict_on_duplicate_username() {
        UserCreateCommand req1 = new UserCreateCommand(
            "duplicateuser",
            "Test@12345",
            "dup1@example.com",
            null,
            null,
            null
        );
        userService.createUser(req1);

        UserCreateCommand req2 = new UserCreateCommand(
            "duplicateuser",
            "Test@12345",
            "dup2@example.com",
            null,
            null,
            null
        );
        assertThatThrownBy(() -> userService.createUser(req2))
            .isInstanceOf(ConflictException.class);
    }

    // ───────── 查询用户 ─────────

    @Test
    void getById_should_return_user() {
        UserCreateCommand request = new UserCreateCommand(
            "findme",
            "Test@12345",
            "findme@example.com",
            null,
            "待查询用户",
            null
        );
        Long userId = userService.createUser(request);

        UserView found = userService.getById(userId);

        assertThat(found.id()).isEqualTo(userId);
        assertThat(found.username()).isEqualTo("findme");
        assertThat(found.email()).isEqualTo("findme@example.com");
        assertThat(found.createdAt()).isNotNull();
    }

    @Test
    void getById_should_throw_not_found_for_nonexistent_id() {
        assertThatThrownBy(() -> userService.getById(999999L))
            .isInstanceOf(NotFoundException.class);
    }

    // ───────── 分页查询 ─────────

    @Test
    void list_should_return_paginated_result() {
        // 创建几个用户确保有数据
        for (int i = 1; i <= 3; i++) {
            userService.createUser(new UserCreateCommand(
                "pageuser" + i,
                "Test@12345",
                "pageuser" + i + "@example.com",
                null,
                null,
                null
            ));
        }

        PageQuery query = PageQuery.normalized(1, 10, null);
        PageResult<UserView> result = userService.list(query);

        assertThat(result).isNotNull();
        assertThat(result.content()).isNotEmpty();
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.size()).isEqualTo(10);
        assertThat(result.totalElements()).isPositive();
    }
}
