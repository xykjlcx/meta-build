package com.metabuild.platform.iam.domain.permission;

import com.metabuild.platform.iam.api.PermissionApi;
import com.metabuild.platform.iam.domain.role.RoleRepository;
import com.metabuild.schema.tables.records.MbIamMenuRecord;
import com.metabuild.schema.tables.records.MbIamRoleRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.metabuild.schema.tables.MbIamMenu.MB_IAM_MENU;
import static com.metabuild.schema.tables.MbIamRoleMenu.MB_IAM_ROLE_MENU;
import static com.metabuild.schema.tables.MbIamUserRole.MB_IAM_USER_ROLE;

/**
 * 权限领域服务（为 Sa-Token 权限回调提供数据）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService implements PermissionApi {

    private final RoleRepository roleRepository;
    private final DSLContext dsl;

    @Override
    public Set<String> getPermissions(Long userId) {
        // 通过用户 → 角色 → 菜单权限码路径查询
        List<String> codes = dsl.selectDistinct(MB_IAM_MENU.PERMISSION_CODE)
            .from(MB_IAM_MENU)
            .join(MB_IAM_ROLE_MENU).on(MB_IAM_ROLE_MENU.MENU_ID.eq(MB_IAM_MENU.ID))
            .join(MB_IAM_USER_ROLE).on(MB_IAM_USER_ROLE.ROLE_ID.eq(MB_IAM_ROLE_MENU.ROLE_ID))
            .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
            .and(MB_IAM_MENU.PERMISSION_CODE.isNotNull())
            .fetchInto(String.class);

        Set<String> permissions = new HashSet<>(codes);
        log.debug("加载用户权限: userId={}, count={}", userId, permissions.size());
        return permissions;
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
