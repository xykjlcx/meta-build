package com.metabuild.admin.dict;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.platform.dict.api.DictErrorCodes;
import com.metabuild.platform.dict.api.cmd.DictDataCreateCmd;
import com.metabuild.platform.dict.api.vo.DictDataVo;
import com.metabuild.platform.dict.api.cmd.DictTypeCreateCmd;
import com.metabuild.platform.dict.api.vo.DictTypeVo;
import com.metabuild.platform.dict.domain.DictService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * DictService 集成测试：覆盖 DictType / DictData CRUD。
 * 缓存失效通过 CacheEvictSupport（afterCommit）触发，事务回滚后不执行，
 * 因此测试中不验证缓存行为，只验证数据库读写是否正确。
 */
@Import(TestSecurityConfig.class)
class DictServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DictService dictService;

    // ───────── DictType CRUD ─────────

    @Test
    void createType_should_return_id() {
        DictTypeCreateCmd req = new DictTypeCreateCmd("用户状态", "user_status", "用户账号状态");

        Long id = dictService.createType(req);

        assertThat(id).isNotNull().isPositive();
    }

    @Test
    void getTypeById_should_return_type() {
        Long id = dictService.createType(new DictTypeCreateCmd("性别", "gender", null));

        DictTypeVo response = dictService.getTypeById(id);

        assertThat(response.id()).isEqualTo(id);
        assertThat(response.code()).isEqualTo("gender");
        assertThat(response.name()).isEqualTo("性别");
        assertThat(response.status()).isEqualTo((short) 1);
    }

    @Test
    void listTypes_should_return_paginated_result() {
        // 创建两条字典类型
        dictService.createType(new DictTypeCreateCmd("类型A", "type_a", null));
        dictService.createType(new DictTypeCreateCmd("类型B", "type_b", null));

        PageResult<DictTypeVo> result = dictService.listTypes(PageQuery.normalized(1, 10, null));

        assertThat(result.content()).isNotEmpty();
        assertThat(result.totalElements()).isPositive();
    }

    @Test
    void createType_should_throw_on_duplicate_code() {
        dictService.createType(new DictTypeCreateCmd("已有类型", "duplicate_code", null));

        assertThatThrownBy(() ->
            dictService.createType(new DictTypeCreateCmd("另一类型", "duplicate_code", null))
        ).isInstanceOf(ConflictException.class)
         .hasMessageContaining(DictErrorCodes.TYPE_CODE_EXISTS);
    }

    @Test
    void deleteType_should_remove_type_and_its_data() {
        Long typeId = dictService.createType(new DictTypeCreateCmd("待删除类型", "to_delete", null));
        dictService.createData(new DictDataCreateCmd(typeId, "选项一", "1", 1, null));

        dictService.deleteType(typeId);

        assertThatThrownBy(() -> dictService.getTypeById(typeId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(DictErrorCodes.TYPE_NOT_FOUND);

        // 类型下的数据也应被级联删除
        List<DictDataVo> data = dictService.listDataByTypeId(typeId);
        assertThat(data).isEmpty();
    }

    // ───────── DictData CRUD ─────────

    @Test
    void createData_should_return_id() {
        Long typeId = dictService.createType(new DictTypeCreateCmd("数据测试类型", "data_test", null));
        DictDataCreateCmd req = new DictDataCreateCmd(typeId, "启用", "1", 1, "账号启用状态");

        Long dataId = dictService.createData(req);

        assertThat(dataId).isNotNull().isPositive();
    }

    @Test
    void listDataByTypeId_should_return_data() {
        Long typeId = dictService.createType(new DictTypeCreateCmd("列表测试", "list_test", null));
        dictService.createData(new DictDataCreateCmd(typeId, "选项一", "1", 1, null));
        dictService.createData(new DictDataCreateCmd(typeId, "选项二", "2", 2, null));

        List<DictDataVo> data = dictService.listDataByTypeId(typeId);

        assertThat(data).hasSize(2);
        assertThat(data).extracting(DictDataVo::label).containsExactlyInAnyOrder("选项一", "选项二");
    }

    @Test
    void deleteData_should_remove_single_item() {
        Long typeId = dictService.createType(new DictTypeCreateCmd("单删测试", "single_del", null));
        Long dataId = dictService.createData(new DictDataCreateCmd(typeId, "待删项", "0", 0, null));

        dictService.deleteData(dataId);

        List<DictDataVo> remaining = dictService.listDataByTypeId(typeId);
        assertThat(remaining).isEmpty();
    }
}
