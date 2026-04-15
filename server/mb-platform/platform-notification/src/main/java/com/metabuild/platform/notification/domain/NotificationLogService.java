package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.vo.NotificationLogVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 通知发送记录查询 Service。
 *
 * <p>Controller 不能直接持有 Repository（ArchUnit 规则），
 * 通过此 Service 中转。
 */
@Service
@RequiredArgsConstructor
public class NotificationLogService {

    private final NotificationLogRepository logRepository;

    /**
     * 按模块 + 关联 ID 查询发送记录。
     */
    public List<NotificationLogVo> findByModuleAndRef(String module, String referenceId) {
        return logRepository.findByModuleAndRef(module, referenceId);
    }
}
