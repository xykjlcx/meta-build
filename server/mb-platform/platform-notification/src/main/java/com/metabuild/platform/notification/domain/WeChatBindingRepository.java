package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.dto.WeChatBindingView;
import com.metabuild.schema.tables.records.MbUserWechatBindingRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

import static com.metabuild.schema.tables.MbUserWechatBinding.MB_USER_WECHAT_BINDING;

/**
 * 微信绑定关系 Repository。
 */
@Repository
@RequiredArgsConstructor
public class WeChatBindingRepository {

    private final DSLContext dsl;

    /**
     * 按平台和用户 ID 列表查询 openId。
     *
     * @param platform 平台类型（MP / MINI）
     * @param appId    应用 AppID
     * @param userIds  用户 ID 列表
     * @return userId → openId 映射（未绑定的用户不在结果中）
     */
    public Map<Long, String> findOpenIds(String platform, String appId, List<Long> userIds) {
        return dsl.select(MB_USER_WECHAT_BINDING.USER_ID, MB_USER_WECHAT_BINDING.OPEN_ID)
                .from(MB_USER_WECHAT_BINDING)
                .where(MB_USER_WECHAT_BINDING.PLATFORM.eq(platform))
                .and(MB_USER_WECHAT_BINDING.APP_ID.eq(appId))
                .and(MB_USER_WECHAT_BINDING.USER_ID.in(userIds))
                .fetchMap(MB_USER_WECHAT_BINDING.USER_ID, MB_USER_WECHAT_BINDING.OPEN_ID);
    }

    /**
     * 插入绑定记录（UPSERT：已存在则更新）。
     */
    public void insert(MbUserWechatBindingRecord record) {
        dsl.insertInto(MB_USER_WECHAT_BINDING)
            .set(record)
            .onConflict(MB_USER_WECHAT_BINDING.TENANT_ID, MB_USER_WECHAT_BINDING.USER_ID,
                        MB_USER_WECHAT_BINDING.PLATFORM, MB_USER_WECHAT_BINDING.APP_ID)
            .doUpdate()
            .set(MB_USER_WECHAT_BINDING.OPEN_ID, record.getOpenId())
            .set(MB_USER_WECHAT_BINDING.UNION_ID, record.getUnionId())
            .set(MB_USER_WECHAT_BINDING.NICKNAME, record.getNickname())
            .set(MB_USER_WECHAT_BINDING.AVATAR_URL, record.getAvatarUrl())
            .set(MB_USER_WECHAT_BINDING.BOUND_AT, record.getBoundAt())
            .execute();
    }

    /**
     * 解绑。
     */
    public boolean unbind(Long userId, String platform, String appId, Long tenantId) {
        return dsl.deleteFrom(MB_USER_WECHAT_BINDING)
            .where(MB_USER_WECHAT_BINDING.USER_ID.eq(userId))
            .and(MB_USER_WECHAT_BINDING.PLATFORM.eq(platform))
            .and(MB_USER_WECHAT_BINDING.APP_ID.eq(appId))
            .and(MB_USER_WECHAT_BINDING.TENANT_ID.eq(tenantId))
            .execute() > 0;
    }

    /**
     * 查询用户的所有绑定关系。
     */
    public List<WeChatBindingView> findByUserId(Long userId, Long tenantId) {
        return dsl.select(
                    MB_USER_WECHAT_BINDING.ID,
                    MB_USER_WECHAT_BINDING.PLATFORM,
                    MB_USER_WECHAT_BINDING.APP_ID,
                    MB_USER_WECHAT_BINDING.OPEN_ID,
                    MB_USER_WECHAT_BINDING.NICKNAME,
                    MB_USER_WECHAT_BINDING.AVATAR_URL,
                    MB_USER_WECHAT_BINDING.BOUND_AT
                )
                .from(MB_USER_WECHAT_BINDING)
                .where(MB_USER_WECHAT_BINDING.USER_ID.eq(userId))
                .and(MB_USER_WECHAT_BINDING.TENANT_ID.eq(tenantId))
                .orderBy(MB_USER_WECHAT_BINDING.BOUND_AT.desc())
                .fetch(r -> new WeChatBindingView(
                        r.get(MB_USER_WECHAT_BINDING.ID),
                        r.get(MB_USER_WECHAT_BINDING.PLATFORM),
                        r.get(MB_USER_WECHAT_BINDING.APP_ID),
                        r.get(MB_USER_WECHAT_BINDING.OPEN_ID),
                        r.get(MB_USER_WECHAT_BINDING.NICKNAME),
                        r.get(MB_USER_WECHAT_BINDING.AVATAR_URL),
                        r.get(MB_USER_WECHAT_BINDING.BOUND_AT)
                ));
    }
}
