package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.iam.api.cmd.DeptCreateCmd;
import com.metabuild.platform.iam.api.cmd.DeptUpdateCmd;
import com.metabuild.platform.iam.api.vo.DeptVo;
import com.metabuild.platform.iam.domain.dept.DeptService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * DeptService 更新路径集成测试：覆盖正常更新 / 防环 / 同 parent name 唯一 / 不存在。
 * parentId=null 表示根节点（schema 层 parent_id 存 NULL，非 0）。
 */
@Import(TestSecurityConfig.class)
class DeptServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DeptService deptService;

    // ───────── 正常更新 ─────────

    @Test
    void updateDept_should_update_name_and_parent_and_leader() {
        Long rootId = deptService.createDept(new DeptCreateCmd(null, "测试根部门A", null, 1));
        Long childId = deptService.createDept(new DeptCreateCmd(rootId, "子部门A", null, 1));

        DeptVo updated = deptService.updateDept(
            childId,
            new DeptUpdateCmd(rootId, "子部门A改名", 1L, 2)
        );

        assertThat(updated.id()).isEqualTo(childId);
        assertThat(updated.name()).isEqualTo("子部门A改名");
        assertThat(updated.leaderUserId()).isEqualTo(1L);
        assertThat(updated.sortOrder()).isEqualTo(2);
    }

    @Test
    void updateDept_allow_move_to_root_with_parentId_null() {
        Long rootId = deptService.createDept(new DeptCreateCmd(null, "测试根部门B", null, 1));
        Long childId = deptService.createDept(new DeptCreateCmd(rootId, "子部门B", null, 1));

        DeptVo updated = deptService.updateDept(
            childId,
            new DeptUpdateCmd(null, "子部门B", null, 1)
        );

        assertThat(updated.parentId()).isNull();
    }

    // ───────── 防环 ─────────

    @Test
    void updateDept_should_reject_self_as_parent() {
        Long deptId = deptService.createDept(new DeptCreateCmd(null, "自环测试", null, 1));

        assertThatThrownBy(() -> deptService.updateDept(
            deptId,
            new DeptUpdateCmd(deptId, "自环测试", null, 1)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.dept.parentCircular");
    }

    @Test
    void updateDept_should_reject_descendant_as_parent() {
        Long rootId = deptService.createDept(new DeptCreateCmd(null, "环测试根", null, 1));
        Long midId = deptService.createDept(new DeptCreateCmd(rootId, "环测试中", null, 1));
        Long leafId = deptService.createDept(new DeptCreateCmd(midId, "环测试叶", null, 1));

        // 尝试把 rootId 移到 leafId 下 → 环
        assertThatThrownBy(() -> deptService.updateDept(
            rootId,
            new DeptUpdateCmd(leafId, "环测试根", null, 1)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("iam.dept.parentCircular");
    }

    // ───────── 同 parent 下 name 唯一 ─────────

    @Test
    void updateDept_should_reject_duplicate_name_under_same_parent() {
        Long rootId = deptService.createDept(new DeptCreateCmd(null, "唯一测试根", null, 1));
        deptService.createDept(new DeptCreateCmd(rootId, "同名A", null, 1));
        Long b = deptService.createDept(new DeptCreateCmd(rootId, "同名B", null, 1));

        assertThatThrownBy(() -> deptService.updateDept(
            b,
            new DeptUpdateCmd(rootId, "同名A", null, 1)
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("iam.dept.nameDuplicate");
    }

    @Test
    void updateDept_should_allow_same_name_under_different_parent() {
        Long r1 = deptService.createDept(new DeptCreateCmd(null, "不同父根1", null, 1));
        Long r2 = deptService.createDept(new DeptCreateCmd(null, "不同父根2", null, 1));
        deptService.createDept(new DeptCreateCmd(r1, "存在名", null, 1));
        Long b = deptService.createDept(new DeptCreateCmd(r2, "待改名", null, 1));

        // 不同父节点下可以同名
        DeptVo updated = deptService.updateDept(
            b,
            new DeptUpdateCmd(r2, "存在名", null, 1)
        );
        assertThat(updated.name()).isEqualTo("存在名");
    }

    @Test
    void updateDept_should_allow_keeping_same_name() {
        Long rootId = deptService.createDept(new DeptCreateCmd(null, "保名测试", null, 1));
        Long id = deptService.createDept(new DeptCreateCmd(rootId, "保持名称", null, 1));

        // 名字没变但其它字段变 → 不触发唯一性冲突
        DeptVo updated = deptService.updateDept(
            id,
            new DeptUpdateCmd(rootId, "保持名称", 1L, 9)
        );
        assertThat(updated.leaderUserId()).isEqualTo(1L);
        assertThat(updated.sortOrder()).isEqualTo(9);
    }

    // ───────── 不存在 ─────────

    @Test
    void updateDept_should_throw_not_found_when_id_missing() {
        assertThatThrownBy(() -> deptService.updateDept(
            9999999999L,
            new DeptUpdateCmd(null, "不存在", null, 1)
        ))
            .isInstanceOf(NotFoundException.class);
    }
}
