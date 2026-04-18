package com.metabuild.platform.iam.domain.menu;

import com.metabuild.schema.tables.records.MbIamMenuRecord;
import com.metabuild.schema.tables.records.MbIamRoleMenuRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamMenu.MB_IAM_MENU;
import static com.metabuild.schema.tables.MbIamRoleMenu.MB_IAM_ROLE_MENU;

/**
 * 菜单数据访问层。
 */
@Repository
@RequiredArgsConstructor
public class MenuRepository {

    private final DSLContext dsl;
    private final Clock clock;

    public Optional<MbIamMenuRecord> findById(Long id) {
        return dsl.selectFrom(MB_IAM_MENU)
            .where(MB_IAM_MENU.ID.eq(id))
            .fetchOptional();
    }

    public List<MbIamMenuRecord> findAll() {
        return dsl.selectFrom(MB_IAM_MENU)
            .orderBy(MB_IAM_MENU.SORT_ORDER.asc())
            .fetch();
    }

    public List<MbIamMenuRecord> findByRoleId(Long roleId) {
        return dsl.selectFrom(MB_IAM_MENU)
            .where(MB_IAM_MENU.ID.in(
                dsl.select(MB_IAM_ROLE_MENU.MENU_ID)
                    .from(MB_IAM_ROLE_MENU)
                    .where(MB_IAM_ROLE_MENU.ROLE_ID.eq(roleId))
            ))
            .orderBy(MB_IAM_MENU.SORT_ORDER.asc())
            .fetch();
    }

    /** 按多个角色 ID 查询可见菜单（去重） */
    public List<MbIamMenuRecord> findByRoleIds(List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) return List.of();
        return dsl.selectDistinct(MB_IAM_MENU.fields())
            .from(MB_IAM_MENU)
            .where(MB_IAM_MENU.ID.in(
                dsl.selectDistinct(MB_IAM_ROLE_MENU.MENU_ID)
                    .from(MB_IAM_ROLE_MENU)
                    .where(MB_IAM_ROLE_MENU.ROLE_ID.in(roleIds))
            ))
            .orderBy(MB_IAM_MENU.SORT_ORDER.asc())
            .fetchInto(MbIamMenuRecord.class);
    }

    public Long insert(MbIamMenuRecord record) {
        dsl.insertInto(MB_IAM_MENU).set(record).execute();
        return record.getId();
    }

    /**
     * 乐观锁更新菜单。Repository 层负责 version + 1 和 updated_at/updated_by。
     */
    public int update(MbIamMenuRecord record, Long updatedBy) {
        return dsl.update(MB_IAM_MENU)
            .set(MB_IAM_MENU.PARENT_ID, record.getParentId())
            .set(MB_IAM_MENU.NAME, record.getName())
            .set(MB_IAM_MENU.PERMISSION_CODE, record.getPermissionCode())
            .set(MB_IAM_MENU.MENU_TYPE, record.getMenuType())
            .set(MB_IAM_MENU.ICON, record.getIcon())
            .set(MB_IAM_MENU.SORT_ORDER, record.getSortOrder())
            .set(MB_IAM_MENU.VISIBLE, record.getVisible())
            .set(MB_IAM_MENU.VERSION, MB_IAM_MENU.VERSION.plus(1))
            .set(MB_IAM_MENU.UPDATED_BY, updatedBy)
            .set(MB_IAM_MENU.UPDATED_AT, OffsetDateTime.now(clock))
            .where(MB_IAM_MENU.ID.eq(record.getId()))
            .and(MB_IAM_MENU.VERSION.eq(record.getVersion()))
            .execute();
    }

    /** 是否有 children */
    public boolean hasChildren(Long id) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_MENU).where(MB_IAM_MENU.PARENT_ID.eq(id))
        );
    }

    /**
     * 查某菜单及其所有后代 ID（含自身），用于防环。
     * PG WITH RECURSIVE；CTE 列用限定名 menu_tree.id 避免与 mb_iam_menu.id 歧义。
     */
    public List<Long> findAllDescendantIds(Long menuId) {
        var menuTree = DSL.name("menu_tree");
        var menuTreeId = DSL.field(DSL.name("menu_tree", "id"), Long.class);

        return dsl.withRecursive(menuTree.as(
                DSL.select(MB_IAM_MENU.ID)
                    .from(MB_IAM_MENU)
                    .where(MB_IAM_MENU.ID.eq(menuId))
                .unionAll(
                    DSL.select(MB_IAM_MENU.ID)
                        .from(MB_IAM_MENU)
                        .join(DSL.table(menuTree))
                        .on(MB_IAM_MENU.PARENT_ID.eq(menuTreeId))
                )
            ))
            .select(menuTreeId)
            .from(DSL.table(menuTree))
            .fetch(menuTreeId);
    }

    /**
     * 检查 permissionCode 是否已存在（用于全局唯一性校验）。
     * permissionCode = null 时返回 false（NULL 允许多条）。
     * excludeId = null 时不排除（创建场景）。
     */
    public boolean existsByPermissionCode(String permissionCode, Long excludeId) {
        if (permissionCode == null) {
            return false;
        }
        var condition = MB_IAM_MENU.PERMISSION_CODE.eq(permissionCode);
        if (excludeId != null) {
            condition = condition.and(MB_IAM_MENU.ID.ne(excludeId));
        }
        return dsl.fetchExists(dsl.selectFrom(MB_IAM_MENU).where(condition));
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_MENU).where(MB_IAM_MENU.ID.eq(id)).execute();
    }

    /** 批量删除角色的菜单关联 */
    public void deleteRoleMenus(Long roleId) {
        dsl.deleteFrom(MB_IAM_ROLE_MENU)
            .where(MB_IAM_ROLE_MENU.ROLE_ID.eq(roleId))
            .execute();
    }

    /** 批量插入角色的菜单关联 */
    public void insertRoleMenus(Long roleId, List<Long> menuIds) {
        if (menuIds == null || menuIds.isEmpty()) return;
        var records = menuIds.stream()
            .map(menuId -> {
                var r = new MbIamRoleMenuRecord();
                r.setRoleId(roleId);
                r.setMenuId(menuId);
                return r;
            })
            .toList();
        dsl.batchInsert(records).execute();
    }
}
