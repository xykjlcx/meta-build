package com.metabuild.platform.iam.domain.menu;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.api.MenuApi;
import com.metabuild.platform.iam.api.dto.MenuCreateCommand;
import com.metabuild.platform.iam.api.dto.MenuView;
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
    private final CurrentUser currentUser;

    @Override
    public MenuView getById(Long id) {
        return menuRepository.findById(id)
            .map(r -> toResponse(r, List.of()))
            .orElseThrow(() -> new NotFoundException("iam.menu.notFound", id));
    }

    @Override
    public List<MenuView> tree() {
        List<MbIamMenuRecord> all = menuRepository.findAll();
        return buildTree(all, 0L);
    }

    @Override
    public List<MenuView> listByRoleId(Long roleId) {
        List<MbIamMenuRecord> menus = menuRepository.findByRoleId(roleId);
        return buildTree(menus, 0L);
    }

    @Transactional
    public Long createMenu(MenuCreateCommand request) {
        var record = new MbIamMenuRecord();
        record.setParentId(request.parentId() != null ? request.parentId() : 0L);
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

    @Transactional
    public void deleteMenu(Long id) {
        menuRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("iam.menu.notFound", id));
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
    private List<MenuView> buildTree(List<MbIamMenuRecord> all, Long parentId) {
        Map<Long, List<MbIamMenuRecord>> byParent = all.stream()
            .collect(Collectors.groupingBy(r -> r.getParentId() == null ? 0L : r.getParentId()));

        return buildChildren(byParent, parentId);
    }

    private List<MenuView> buildChildren(Map<Long, List<MbIamMenuRecord>> byParent, Long parentId) {
        List<MbIamMenuRecord> children = byParent.getOrDefault(parentId, List.of());
        List<MenuView> result = new ArrayList<>(children.size());
        for (MbIamMenuRecord r : children) {
            List<MenuView> subChildren = buildChildren(byParent, r.getId());
            result.add(toResponse(r, subChildren));
        }
        return result;
    }

    private MenuView toResponse(MbIamMenuRecord r, List<MenuView> children) {
        return new MenuView(
            r.getId(),
            r.getParentId(),
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
