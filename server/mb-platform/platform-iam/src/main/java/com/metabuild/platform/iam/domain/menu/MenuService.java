package com.metabuild.platform.iam.domain.menu;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.CommonErrorCodes;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.IamErrorCodes;
import com.metabuild.platform.iam.api.MenuApi;
import com.metabuild.platform.iam.api.cmd.MenuCreateCmd;
import com.metabuild.platform.iam.api.cmd.MenuUpdateCmd;
import com.metabuild.platform.iam.api.vo.MenuVo;
import com.metabuild.platform.iam.domain.role.RoleRepository;
import com.metabuild.schema.tables.records.MbIamMenuRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 菜单领域服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService implements MenuApi {

    private final MenuRepository menuRepository;
    private final RoleRepository roleRepository;
    private final CurrentUser currentUser;
    private final SnowflakeIdGenerator idGenerator;

    @Override
    public MenuVo getById(Long id) {
        return menuRepository.findById(id)
            .map(r -> toResponse(r, List.of()))
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.MENU_NOT_FOUND, id));
    }

    @Override
    public List<MenuVo> tree() {
        List<MbIamMenuRecord> all = menuRepository.findAll();
        return buildTree(all, 0L);
    }

    @Override
    public List<MenuVo> listByRoleId(Long roleId) {
        List<MbIamMenuRecord> menus = menuRepository.findByRoleId(roleId);
        return buildTree(menus, 0L);
    }

    /**
     * 获取当前用户可见的菜单树。
     * 管理员返回全部菜单，普通用户按角色过滤。
     */
    public List<MenuVo> currentUserMenuTree() {
        if (currentUser.isAdmin()) {
            // 管理员看全部菜单
            return tree();
        }
        List<Long> roleIds = roleRepository.findRoleIdsByUserId(currentUser.userId());
        List<MbIamMenuRecord> menus = menuRepository.findByRoleIds(roleIds);
        return buildTree(menus, 0L);
    }

    @Transactional
    public Long createMenu(MenuCreateCmd request) {
        // BUTTON 类型必须有 permissionCode
        if ("BUTTON".equals(request.menuType())
            && (request.permissionCode() == null || request.permissionCode().isBlank())) {
            throw new BusinessException(IamErrorCodes.MENU_BUTTON_PERMISSION_REQUIRED);
        }
        // permissionCode 全局唯一
        if (menuRepository.existsByPermissionCode(request.permissionCode(), null)) {
            throw new ConflictException(IamErrorCodes.MENU_PERMISSION_CODE_DUPLICATE,
                request.permissionCode());
        }

        var record = new MbIamMenuRecord();
        record.setId(idGenerator.nextId());
        record.setParentId(request.parentId()); // null 表示顶级菜单
        record.setName(request.name());
        record.setPermissionCode(request.permissionCode());
        record.setMenuType(request.menuType());
        record.setIcon(request.icon());
        record.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        record.setVisible(request.visible() != null ? request.visible() : true);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setVersion(0);

        Long menuId = menuRepository.insert(record);
        log.info("创建菜单: menuId={}, name={}", menuId, request.name());
        return menuId;
    }

    /**
     * 更新菜单。校验：
     * 1. parentId 不能是自己或后代（防环）
     * 2. 有 children 不能改为 BUTTON
     * 3. BUTTON 必须有 permissionCode
     * 4. permissionCode 全局唯一（排除自身，null 允许多条）
     */
    @Transactional
    public MenuVo updateMenu(Long id, MenuUpdateCmd request) {
        var record = menuRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.MENU_NOT_FOUND, id));

        Long newParentId = request.parentId();

        // 防环
        if (newParentId != null) {
            if (newParentId.equals(id)) {
                throw new BusinessException(IamErrorCodes.MENU_PARENT_CIRCULAR);
            }
            List<Long> descendantIds = menuRepository.findAllDescendantIds(id);
            if (descendantIds.contains(newParentId)) {
                throw new BusinessException(IamErrorCodes.MENU_PARENT_CIRCULAR);
            }
        }

        // 有 children 不能改为 BUTTON
        if ("BUTTON".equals(request.menuType()) && menuRepository.hasChildren(id)) {
            throw new BusinessException(IamErrorCodes.MENU_CHILDREN_EXIST);
        }

        // BUTTON 必须有 permissionCode
        if ("BUTTON".equals(request.menuType())
            && (request.permissionCode() == null || request.permissionCode().isBlank())) {
            throw new BusinessException(IamErrorCodes.MENU_BUTTON_PERMISSION_REQUIRED);
        }

        // permissionCode 全局唯一（排除自身）
        if (menuRepository.existsByPermissionCode(request.permissionCode(), id)) {
            throw new ConflictException(IamErrorCodes.MENU_PERMISSION_CODE_DUPLICATE,
                request.permissionCode());
        }

        record.setParentId(newParentId);
        record.setName(request.name());
        record.setPermissionCode(request.permissionCode());
        record.setMenuType(request.menuType());
        record.setIcon(request.icon());
        if (request.sortOrder() != null) {
            record.setSortOrder(request.sortOrder());
        }
        if (request.visible() != null) {
            record.setVisible(request.visible());
        }

        int updated = menuRepository.update(record, currentUser.userIdOrSystem());
        if (updated == 0) {
            throw new ConflictException(CommonErrorCodes.CONCURRENT_MODIFICATION);
        }
        log.info("更新菜单: menuId={}, name={}", id, request.name());
        return toResponse(record, List.of());
    }

    @Transactional
    public void deleteMenu(Long id) {
        menuRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(IamErrorCodes.MENU_NOT_FOUND, id));
        menuRepository.deleteById(id);
        log.info("删除菜单: menuId={}", id);
    }

    @Transactional
    public void assignMenusToRole(Long roleId, List<Long> menuIds) {
        menuRepository.deleteRoleMenus(roleId);
        menuRepository.insertRoleMenus(roleId, menuIds);
        log.info("分配菜单到角色: roleId={}, menuCount={}", roleId, menuIds.size());
    }

    /** 构建菜单树（递归，parentId=0 为根节点） */
    private List<MenuVo> buildTree(List<MbIamMenuRecord> all, Long parentId) {
        Map<Long, List<MbIamMenuRecord>> byParent = all.stream()
            .collect(Collectors.groupingBy(r -> r.getParentId() == null ? 0L : r.getParentId()));

        return buildChildren(byParent, parentId);
    }

    private List<MenuVo> buildChildren(Map<Long, List<MbIamMenuRecord>> byParent, Long parentId) {
        List<MbIamMenuRecord> children = byParent.getOrDefault(parentId, List.of());
        List<MenuVo> result = new ArrayList<>(children.size());
        for (MbIamMenuRecord r : children) {
            List<MenuVo> subChildren = buildChildren(byParent, r.getId());
            result.add(toResponse(r, subChildren));
        }
        return result;
    }

    private MenuVo toResponse(MbIamMenuRecord r, List<MenuVo> children) {
        // 根节点 parentId=0（DDL DEFAULT 0）转为 null，前端期望 null 表示"无父节点"
        Long parentId = r.getParentId() != null && r.getParentId() == 0L ? null : r.getParentId();
        return new MenuVo(
            r.getId(),
            parentId,
            r.getName(),
            r.getPermissionCode(),
            r.getMenuType(),
            r.getIcon(),
            r.getSortOrder(),
            r.getVisible(),
            children
        );
    }
}
