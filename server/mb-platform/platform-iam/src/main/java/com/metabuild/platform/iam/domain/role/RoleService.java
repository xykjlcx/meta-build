package com.metabuild.platform.iam.domain.role;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.CommonErrorCodes;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.IamErrorCodes;
import com.metabuild.platform.iam.api.RoleApi;
import com.metabuild.platform.iam.api.dto.AssignRolesCommand;
import com.metabuild.platform.iam.api.dto.RoleCreateCommand;
import com.metabuild.platform.iam.api.dto.RoleView;
import com.metabuild.platform.iam.api.dto.RoleUpdateCommand;
import com.metabuild.schema.tables.records.MbIamRoleRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 角色领域服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleService implements RoleApi {

    private final RoleRepository roleRepository;
    private final CurrentUser currentUser;
    private final SnowflakeIdGenerator idGenerator;

    @Override
    public RoleView getById(Long id) {
        return roleRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.ROLE_NOT_FOUND, id));
    }

    @Override
    public List<RoleView> listByUserId(Long userId) {
        return roleRepository.findByUserId(userId).stream()
            .map(this::toResponse)
            .toList();
    }

    public PageResult<RoleView> listPage(PageQuery query) {
        PageResult<MbIamRoleRecord> page = roleRepository.findPage(query);
        List<RoleView> content = page.content().stream().map(this::toResponse).toList();
        return new PageResult<>(content, page.totalElements(), page.totalPages(), page.page(), page.size());
    }

    @Transactional
    public Long createRole(RoleCreateCommand request) {
        if (roleRepository.existsByCode(request.code())) {
            throw new ConflictException(IamErrorCodes.ROLE_CODE_EXISTS, request.code());
        }

        var record = new MbIamRoleRecord();
        record.setId(idGenerator.nextId());
        record.setName(request.name());
        record.setCode(request.code());
        record.setDataScope(request.dataScope() != null ? request.dataScope() : "SELF");
        record.setRemark(request.remark());
        record.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        record.setStatus((short) 1);
        record.setOwnerDeptId(0L);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(0);

        Long roleId = roleRepository.insert(record);
        log.info("创建角色: roleId={}, code={}", roleId, request.code());
        return roleId;
    }

    @Transactional
    public RoleView updateRole(Long id, RoleUpdateCommand request) {
        var record = roleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.ROLE_NOT_FOUND, id));

        if (request.name() != null) record.setName(request.name());
        if (request.dataScope() != null) record.setDataScope(request.dataScope());
        if (request.remark() != null) record.setRemark(request.remark());
        if (request.status() != null) record.setStatus(request.status());
        if (request.sortOrder() != null) record.setSortOrder(request.sortOrder());

        int updated = roleRepository.update(record, currentUser.userIdOrSystem());
        if (updated == 0) {
            throw new ConflictException(CommonErrorCodes.CONCURRENT_MODIFICATION);
        }
        return toResponse(record);
    }

    @Transactional
    public void deleteRole(Long id) {
        roleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.ROLE_NOT_FOUND, id));
        // 显式清理关联数据（FK CASCADE 也会删，但显式操作意图更清晰）
        roleRepository.deleteUserRolesByRoleId(id);
        roleRepository.deleteRoleMenusByRoleId(id);
        roleRepository.deleteDataScopeDeptsByRoleId(id);
        roleRepository.deleteById(id);
        log.info("删除角色: roleId={}", id);
    }

    @Transactional
    public void assignRolesToUser(Long userId, AssignRolesCommand request) {
        roleRepository.deleteUserRoles(userId);
        roleRepository.insertUserRoles(userId, request.roleIds());
        log.info("分配角色: userId={}, roleIds={}", userId, request.roleIds());
    }

    private RoleView toResponse(MbIamRoleRecord r) {
        return new RoleView(
            r.getId(),
            r.getName(),
            r.getCode(),
            r.getDataScope(),
            r.getRemark(),
            r.getStatus(),
            r.getSortOrder(),
            r.getCreatedAt(),
            r.getUpdatedAt()
        );
    }
}
