package com.metabuild.platform.iam.domain.role;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.RoleApi;
import com.metabuild.platform.iam.api.dto.AssignRolesRequest;
import com.metabuild.platform.iam.api.dto.RoleCreateRequest;
import com.metabuild.platform.iam.api.dto.RoleResponse;
import com.metabuild.platform.iam.api.dto.RoleUpdateRequest;
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

    @Override
    public RoleResponse getById(Long id) {
        return roleRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException("iam.role.notFound", id));
    }

    @Override
    public List<RoleResponse> listByUserId(Long userId) {
        return roleRepository.findByUserId(userId).stream()
            .map(this::toResponse)
            .toList();
    }

    public PageResult<RoleResponse> listPage(PageQuery query) {
        PageResult<MbIamRoleRecord> page = roleRepository.findPage(query);
        List<RoleResponse> content = page.content().stream().map(this::toResponse).toList();
        return new PageResult<>(content, page.totalElements(), page.totalPages(), page.page(), page.size());
    }

    @Transactional
    public Long createRole(RoleCreateRequest request) {
        if (roleRepository.existsByCode(request.code())) {
            throw new ConflictException("iam.role.codeExists", request.code());
        }

        var record = new MbIamRoleRecord();
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
    public RoleResponse updateRole(Long id, RoleUpdateRequest request) {
        var record = roleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("iam.role.notFound", id));

        if (request.name() != null) record.setName(request.name());
        if (request.dataScope() != null) record.setDataScope(request.dataScope());
        if (request.remark() != null) record.setRemark(request.remark());
        if (request.status() != null) record.setStatus(request.status());
        if (request.sortOrder() != null) record.setSortOrder(request.sortOrder());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(record.getVersion() + 1);

        int updated = roleRepository.update(record);
        if (updated == 0) {
            throw new BusinessException("common.concurrentModification", 409);
        }
        return toResponse(record);
    }

    @Transactional
    public void deleteRole(Long id) {
        roleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("iam.role.notFound", id));
        roleRepository.deleteById(id);
        log.info("删除角色: roleId={}", id);
    }

    @Transactional
    public void assignRolesToUser(Long userId, AssignRolesRequest request) {
        roleRepository.deleteUserRoles(userId);
        roleRepository.insertUserRoles(userId, request.roleIds());
        log.info("分配角色: userId={}, roleIds={}", userId, request.roleIds());
    }

    private RoleResponse toResponse(MbIamRoleRecord r) {
        return new RoleResponse(
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
