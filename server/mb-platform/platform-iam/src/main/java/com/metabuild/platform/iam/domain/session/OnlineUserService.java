package com.metabuild.platform.iam.domain.session;

import com.metabuild.common.security.AuthFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 在线用户服务（基于 AuthFacade 门面管理会话，零感知 Sa-Token）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnlineUserService {

    private final AuthFacade authFacade;

    /**
     * 踢出用户（强制下线所有会话）。
     */
    public void kickout(Long userId) {
        authFacade.kickout(userId);
        log.info("强制踢出用户: userId={}", userId);
    }

    /**
     * 获取在线用户数量。
     */
    public long onlineCount() {
        return authFacade.onlineUserCount();
    }

    /**
     * 检查用户是否在线。
     */
    public boolean isOnline(Long userId) {
        return authFacade.isUserOnline(userId);
    }
}
