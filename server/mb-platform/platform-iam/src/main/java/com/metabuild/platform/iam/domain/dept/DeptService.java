package com.metabuild.platform.iam.domain.dept;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.DeptApi;
import com.metabuild.platform.iam.api.IamErrorCodes;
import com.metabuild.platform.iam.api.cmd.DeptCreateCmd;
import com.metabuild.platform.iam.api.vo.DeptVo;
import com.metabuild.schema.tables.records.MbIamDeptRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 部门领域服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeptService implements DeptApi {

    private final DeptRepository deptRepository;
    private final CurrentUser currentUser;
    private final SnowflakeIdGenerator idGenerator;

    @Override
    public DeptVo getById(Long id) {
        return deptRepository.findById(id)
            .map(r -> toResponse(r, List.of()))
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.DEPT_NOT_FOUND, id));
    }

    @Override
    public List<DeptVo> tree() {
        List<MbIamDeptRecord> all = deptRepository.findAll();
        return buildTree(all, 0L);
    }

    @Transactional
    public Long createDept(DeptCreateCmd request) {
        var record = new MbIamDeptRecord();
        record.setId(idGenerator.nextId());
        record.setParentId(request.parentId()); // null 表示根部门
        record.setName(request.name());
        record.setLeaderUserId(request.leaderUserId());
        record.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        record.setStatus((short) 1);
        record.setOwnerDeptId(0L);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(0);

        Long deptId = deptRepository.insert(record);
        log.info("创建部门: deptId={}, name={}", deptId, request.name());
        return deptId;
    }

    @Transactional
    public void deleteDept(Long id) {
        deptRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.DEPT_NOT_FOUND, id));
        if (deptRepository.hasChildren(id)) {
            throw new BusinessException(IamErrorCodes.DEPT_HAS_CHILDREN);
        }
        if (deptRepository.hasUsers(id)) {
            throw new BusinessException(IamErrorCodes.DEPT_HAS_USERS);
        }
        deptRepository.deleteById(id);
        log.info("删除部门: deptId={}", id);
    }

    /** 构建部门树 */
    private List<DeptVo> buildTree(List<MbIamDeptRecord> all, Long parentId) {
        Map<Long, List<MbIamDeptRecord>> byParent = all.stream()
            .collect(Collectors.groupingBy(r -> r.getParentId() == null ? 0L : r.getParentId()));
        return buildChildren(byParent, parentId);
    }

    private List<DeptVo> buildChildren(Map<Long, List<MbIamDeptRecord>> byParent, Long parentId) {
        List<MbIamDeptRecord> children = byParent.getOrDefault(parentId, List.of());
        List<DeptVo> result = new ArrayList<>(children.size());
        for (MbIamDeptRecord r : children) {
            List<DeptVo> subChildren = buildChildren(byParent, r.getId());
            result.add(toResponse(r, subChildren));
        }
        return result;
    }

    private DeptVo toResponse(MbIamDeptRecord r, List<DeptVo> children) {
        return new DeptVo(
            r.getId(),
            r.getParentId(),
            r.getName(),
            r.getLeaderUserId(),
            r.getStatus(),
            r.getSortOrder(),
            r.getCreatedAt(),
            children
        );
    }
}
