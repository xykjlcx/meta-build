package com.metabuild.platform.iam.domain.permission;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.metabuild.schema.tables.MbIamMenu.MB_IAM_MENU;
import static com.metabuild.schema.tables.MbIamRoleMenu.MB_IAM_ROLE_MENU;
import static com.metabuild.schema.tables.MbIamUserRole.MB_IAM_USER_ROLE;

/**
 * 权限数据访问层（用户→角色→菜单权限码三表 JOIN）。
 */
@Repository
@RequiredArgsConstructor
public class PermissionRepository {

    private final DSLContext dsl;

    /**
     * 查询用户的所有权限码（通过 user→role→menu 三表 JOIN）。
     */
    public List<String> findPermissionCodesByUserId(Long userId) {
        return dsl.selectDistinct(MB_IAM_MENU.PERMISSION_CODE)
            .from(MB_IAM_MENU)
            .join(MB_IAM_ROLE_MENU).on(MB_IAM_ROLE_MENU.MENU_ID.eq(MB_IAM_MENU.ID))
            .join(MB_IAM_USER_ROLE).on(MB_IAM_USER_ROLE.ROLE_ID.eq(MB_IAM_ROLE_MENU.ROLE_ID))
            .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
            .and(MB_IAM_MENU.PERMISSION_CODE.isNotNull())
            .fetchInto(String.class);
    }
}
