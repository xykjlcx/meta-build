package com.metabuild.platform.iam.domain.menu;

import com.metabuild.schema.tables.records.MbIamMenuRecord;
import com.metabuild.schema.tables.records.MbIamRoleMenuRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

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

    public Long insert(MbIamMenuRecord record) {
        dsl.insertInto(MB_IAM_MENU).set(record).execute();
        return record.getId();
    }

    public int update(MbIamMenuRecord record) {
        return dsl.update(MB_IAM_MENU)
            .set(record)
            .where(MB_IAM_MENU.ID.eq(record.getId()))
            .and(MB_IAM_MENU.VERSION.eq(record.getVersion() - 1))
            .execute();
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
