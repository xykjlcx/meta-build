package com.metabuild.platform.iam.domain.datascope;

import com.metabuild.infra.jooq.DataScopeRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * IAM 模块数据权限注册器。
 * 在应用启动时向 DataScopeRegistry 注册需要数据权限过滤的表。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataScopeLoader {

    private final DataScopeRegistry dataScopeRegistry;

    @PostConstruct
    public void init() {
        // 注册需要数据权限过滤的表（dept_id 字段）
        dataScopeRegistry.register("mb_iam_user", "owner_dept_id");
        dataScopeRegistry.register("mb_iam_dept", "owner_dept_id");

        // mb_iam_login_log 是追加表，不注册数据权限
        log.info("IAM 数据权限注册完成");
    }
}
