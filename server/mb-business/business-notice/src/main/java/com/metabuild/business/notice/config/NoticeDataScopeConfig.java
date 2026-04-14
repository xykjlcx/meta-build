package com.metabuild.business.notice.config;

import com.metabuild.infra.jooq.DataScopeRegistry;
import org.springframework.context.annotation.Configuration;

/**
 * 公告模块数据权限注册。
 */
@Configuration
public class NoticeDataScopeConfig {

    public NoticeDataScopeConfig(DataScopeRegistry registry) {
        registry.register("biz_notice", "owner_dept_id");
    }
}
