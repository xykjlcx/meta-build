package com.metabuild.platform.iam.api;

import com.metabuild.platform.iam.api.dto.MenuView;
import java.util.List;

/**
 * 菜单模块对外 API 接口（供跨模块调用）。
 */
public interface MenuApi {

    MenuView getById(Long id);

    List<MenuView> tree();

    /** 查询指定角色的菜单列表 */
    List<MenuView> listByRoleId(Long roleId);
}
