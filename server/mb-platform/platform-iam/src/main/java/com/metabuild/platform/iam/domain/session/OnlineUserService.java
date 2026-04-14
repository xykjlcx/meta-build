package com.metabuild.platform.iam.domain.session;

import cn.dev33.satoken.stp.SaTokenInfo;
import cn.dev33.satoken.stp.StpUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 在线用户服务（基于 Sa-Token Session 管理）。
 */
@Slf4j
@Service
public class OnlineUserService {

    /**
     * 踢出用户（强制下线所有会话）。
     */
    public void kickout(Long userId) {
        StpUtil.kickout(userId);
        log.info("强制踢出用户: userId={}", userId);
    }

    /**
     * 获取在线用户数量。
     */
    public long onlineCount() {
        return StpUtil.searchSessionId("", 0, -1, false).size();
    }

    /**
     * 检查用户是否在线。
     */
    public boolean isOnline(Long userId) {
        return StpUtil.isLogin(userId);
    }
}
