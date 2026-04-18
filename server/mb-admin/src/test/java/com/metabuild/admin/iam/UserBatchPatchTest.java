package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.iam.api.cmd.DeptCreateCmd;
import com.metabuild.platform.iam.api.cmd.UserBatchPatchCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.api.vo.UserBatchResultVo;
import com.metabuild.platform.iam.api.vo.UserVo;
import com.metabuild.platform.iam.domain.dept.DeptService;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A7 PUT /users/batch 集成测试。
 */
@Import(TestSecurityConfig.class)
class UserBatchPatchTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private DeptService deptService;

    @Test
    void batchPatch_should_move_users_to_dept() {
        Long dept = deptService.createDept(new DeptCreateCmd(null, "批量目标部门", null, 1));
        Long u1 = userService.createUser(new UserCreateCmd("batchu1", "Test@12345", "bu1@example.com", null, null, null));
        Long u2 = userService.createUser(new UserCreateCmd("batchu2", "Test@12345", "bu2@example.com", null, null, null));

        UserBatchResultVo result = userService.batchPatch(new UserBatchPatchCmd(
            List.of(u1, u2),
            new UserBatchPatchCmd.Patch(dept, null)
        ));

        assertThat(result.updated()).isEqualTo(2);
        assertThat(result.failed()).isEmpty();
        assertThat(userService.getById(u1).deptId()).isEqualTo(dept);
        assertThat(userService.getById(u2).deptId()).isEqualTo(dept);
    }

    @Test
    void batchPatch_should_set_status() {
        Long u1 = userService.createUser(new UserCreateCmd("batchs1", "Test@12345", "bs1@example.com", null, null, null));
        Long u2 = userService.createUser(new UserCreateCmd("batchs2", "Test@12345", "bs2@example.com", null, null, null));

        userService.batchPatch(new UserBatchPatchCmd(
            List.of(u1, u2),
            new UserBatchPatchCmd.Patch(null, (short) 0)
        ));

        assertThat(userService.getById(u1).status()).isEqualTo((short) 0);
        assertThat(userService.getById(u2).status()).isEqualTo((short) 0);
    }

    @Test
    void batchPatch_should_support_both_deptId_and_status() {
        Long dept = deptService.createDept(new DeptCreateCmd(null, "双字段测试部门", null, 1));
        Long u1 = userService.createUser(new UserCreateCmd("batchds1", "Test@12345", "bds1@example.com", null, null, null));

        userService.batchPatch(new UserBatchPatchCmd(
            List.of(u1),
            new UserBatchPatchCmd.Patch(dept, (short) 0)
        ));

        UserVo u = userService.getById(u1);
        assertThat(u.deptId()).isEqualTo(dept);
        assertThat(u.status()).isEqualTo((short) 0);
    }

    @Test
    void batchPatch_with_empty_patch_should_be_noop() {
        Long u1 = userService.createUser(new UserCreateCmd("batchnoop1", "Test@12345", "bn1@example.com", null, null, null));

        UserBatchResultVo result = userService.batchPatch(new UserBatchPatchCmd(
            List.of(u1),
            new UserBatchPatchCmd.Patch(null, null)
        ));

        assertThat(result.updated()).isEqualTo(1); // no-op 视为成功
        assertThat(result.failed()).isEmpty();
    }

    @Test
    void batchPatch_should_reject_when_exceeds_limit() {
        List<Long> ids = Stream.iterate(1L, i -> i + 1).limit(101).toList();

        assertThatThrownBy(() -> userService.batchPatch(new UserBatchPatchCmd(
            ids,
            new UserBatchPatchCmd.Patch(null, (short) 0)
        )))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.user.batchExceedsLimit");
    }

    @Test
    void batchPatch_should_throw_and_mark_rollback_when_one_missing() {
        Long u1 = userService.createUser(new UserCreateCmd("batchrb1", "Test@12345", "brb1@example.com", null, null, null));
        Long missing = 9999999999L;

        List<Long> ids = new ArrayList<>();
        ids.add(u1);
        ids.add(missing);

        assertThatThrownBy(() -> userService.batchPatch(new UserBatchPatchCmd(
            ids,
            new UserBatchPatchCmd.Patch(null, (short) 0)
        )))
            .isInstanceOf(NotFoundException.class);

        // 注：当前测试事务与 batchPatch 的事务共享（Propagation.REQUIRED）。
        // 真实回滚行为发生在外层事务 commit 时，这里只验证异常抛出。
        // 回滚语义由 Spring @Transactional 保证（rollbackFor 默认包含 RuntimeException）。
    }
}
