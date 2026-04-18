package com.metabuild.platform.iam.domain.permission;

import com.metabuild.platform.iam.domain.menu.MenuRepository;
import com.metabuild.platform.iam.domain.role.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 权限写入门面：所有"会改变某用户最终权限码集合"的写操作必须经过这里。
 * 职责：
 * 1. 通过 Repository 写 mb_iam_user_role / mb_iam_role_menu
 * 2. 计算受影响的 userIds
 * 3. afterCommit 发 PermissionChangedEvent，监听器异步失效缓存
 * <p>
 * ArchUnit 兜底（task 7）：禁止 user_role / role_menu 的 jOOQ 写操作出现在 Facade 之外。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionWriteFacade {

    private final RoleRepository roleRepository;
    private final MenuRepository menuRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** 替换某用户的角色集合。 */
    @Transactional
    public void assignRolesToUser(Long userId, List<Long> roleIds) {
        roleRepository.deleteUserRoles(userId);
        roleRepository.insertUserRoles(userId, roleIds);
        publishAfterCommit(Set.of(userId));
    }

    /** 移除某用户的部分角色绑定。 */
    @Transactional
    public void removeRolesFromUser(Long userId, Set<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) return;
        roleRepository.deleteUserRolesByUserAndRoleIds(userId, roleIds);
        publishAfterCommit(Set.of(userId));
    }

    /** 替换某角色的菜单（=权限码）集合。 */
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> menuIds) {
        Set<Long> affected = new HashSet<>(roleRepository.findUserIdsByRoleId(roleId));
        menuRepository.deleteRoleMenus(roleId);
        menuRepository.insertRoleMenus(roleId, menuIds);
        publishAfterCommit(affected);
    }

    /** 移除某角色的部分菜单绑定。 */
    @Transactional
    public void removePermissionsFromRole(Long roleId, Set<Long> menuIds) {
        if (menuIds == null || menuIds.isEmpty()) return;
        Set<Long> affected = new HashSet<>(roleRepository.findUserIdsByRoleId(roleId));
        menuRepository.deleteRoleMenusByMenuIds(roleId, menuIds);
        publishAfterCommit(affected);
    }

    /** 删除角色：影响所有持该角色的用户。 */
    @Transactional
    public void deleteRole(Long roleId) {
        Set<Long> affected = new HashSet<>(roleRepository.findUserIdsByRoleId(roleId));
        roleRepository.deleteUserRolesByRoleId(roleId);
        roleRepository.deleteRoleMenusByRoleId(roleId);
        roleRepository.deleteDataScopeDeptsByRoleId(roleId);
        roleRepository.deleteById(roleId);
        publishAfterCommit(affected);
    }

    private void publishAfterCommit(Set<Long> userIds) {
        if (userIds.isEmpty()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisher.publishEvent(new PermissionChangedEvent(userIds));
                    log.debug("PermissionChangedEvent 已发布: userIds={}", userIds);
                }
            });
        } else {
            eventPublisher.publishEvent(new PermissionChangedEvent(userIds));
        }
    }
}
