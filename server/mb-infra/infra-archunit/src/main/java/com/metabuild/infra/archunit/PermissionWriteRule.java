package com.metabuild.infra.archunit;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaMethodCall;
import com.tngtech.archunit.lang.ArchRule;

import java.util.Map;
import java.util.Set;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 权限写入规则：mb_iam_user_role / mb_iam_role_menu 的写操作必须经 PermissionWriteFacade。
 *
 * <p>Facade 负责在事务 afterCommit 发 PermissionChangedEvent 触发缓存失效；
 * 绕过 Facade 直接调 Repository 写方法会导致权限缓存 drift。</p>
 */
public final class PermissionWriteRule {

    private PermissionWriteRule() {}

    private static final String FACADE_FQN =
        "com.metabuild.platform.iam.domain.permission.PermissionWriteFacade";

    private static final String ROLE_REPOSITORY_FQN =
        "com.metabuild.platform.iam.domain.role.RoleRepository";

    private static final String MENU_REPOSITORY_FQN =
        "com.metabuild.platform.iam.domain.menu.MenuRepository";

    /**
     * Repository → 权限关联表写方法清单。
     * RoleRepository：写 mb_iam_user_role / mb_iam_role_menu 的方法
     * MenuRepository：写 mb_iam_role_menu 的方法
     */
    private static final Map<String, Set<String>> PROTECTED_WRITE_METHODS = Map.of(
        ROLE_REPOSITORY_FQN, Set.of(
            "deleteUserRoles",
            "deleteUserRolesByUserAndRoleIds",
            "deleteUserRolesByRoleId",
            "insertUserRoles",
            "deleteRoleMenusByRoleId"
        ),
        MENU_REPOSITORY_FQN, Set.of(
            "deleteRoleMenus",
            "deleteRoleMenusByMenuIds",
            "insertRoleMenus"
        )
    );

    public static final ArchRule ONLY_PERMISSION_WRITE_FACADE_CAN_CALL_PERMISSION_WRITE_METHODS =
        noClasses()
            .that().doNotHaveFullyQualifiedName(FACADE_FQN)
            .should().callMethodWhere(isProtectedWriteCall())
            .because("权限/角色表写操作必须经过 PermissionWriteFacade，"
                + "否则事件驱动缓存失效会遗漏导致权限 drift");

    private static DescribedPredicate<JavaMethodCall> isProtectedWriteCall() {
        return new DescribedPredicate<>("call a protected permission-write method") {
            @Override
            public boolean test(JavaMethodCall call) {
                String ownerFqn = call.getTargetOwner().getFullName();
                Set<String> methods = PROTECTED_WRITE_METHODS.get(ownerFqn);
                return methods != null && methods.contains(call.getName());
            }
        };
    }
}
