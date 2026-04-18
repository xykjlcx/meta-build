package com.metabuild.platform.iam.domain.permission;

import com.metabuild.platform.iam.api.PermissionApi;
import com.metabuild.platform.iam.domain.role.RoleRepository;
import com.metabuild.schema.tables.records.MbIamRoleRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 权限领域服务（为 Sa-Token 权限回调提供数据）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService implements PermissionApi {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionCache permissionCache;

    @Override
    public Set<String> getPermissions(Long userId) {
        return permissionCache.get(userId).orElseGet(() -> {
            List<String> codes = permissionRepository.findPermissionCodesByUserId(userId);
            Set<String> permissions = new HashSet<>(codes);
            permissionCache.put(userId, permissions);
            log.debug("加载用户权限: userId={}, count={} (DB)", userId, permissions.size());
            return permissions;
        });
    }

    @Override
    public Set<String> getRoles(Long userId) {
        List<MbIamRoleRecord> roles = roleRepository.findByUserId(userId);
        Set<String> roleCodes = new HashSet<>();
        for (MbIamRoleRecord role : roles) {
            roleCodes.add(role.getCode());
        }
        log.debug("加载用户角色: userId={}, count={}", userId, roleCodes.size());
        return roleCodes;
    }
}
