package com.metabuild.infra.security;

import cn.dev33.satoken.stp.StpInterface;
import cn.dev33.satoken.stp.StpUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Sa-Token 权限/角色查询回调实现。
 * Sa-Token 在检查权限时会调用此接口，从 Session 中读取预加载的权限数据。
 */
@Slf4j
@Component
public class SaPermissionImpl implements StpInterface {

    @Override
    @SuppressWarnings("unchecked")
    public List<String> getPermissionList(Object loginId, String loginType) {
        try {
            var session = StpUtil.getSessionByLoginId(loginId, false);
            if (session == null) return List.of();
            Object val = session.get(SaTokenCurrentUser.KEY_PERMISSIONS);
            if (val instanceof Set<?> set) {
                return new ArrayList<>((Set<String>) set);
            }
        } catch (Exception e) {
            log.warn("获取权限列表失败: loginId={}, error={}", loginId, e.getMessage());
        }
        return List.of();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<String> getRoleList(Object loginId, String loginType) {
        try {
            var session = StpUtil.getSessionByLoginId(loginId, false);
            if (session == null) return List.of();
            Object val = session.get(SaTokenCurrentUser.KEY_ROLES);
            if (val instanceof Set<?> set) {
                return new ArrayList<>((Set<String>) set);
            }
        } catch (Exception e) {
            log.warn("获取角色列表失败: loginId={}, error={}", loginId, e.getMessage());
        }
        return List.of();
    }
}
