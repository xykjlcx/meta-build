package com.metabuild.platform.notification.domain.binding;

import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.notification.api.NotificationErrorCodes;
import com.metabuild.platform.notification.api.vo.WeChatBindingVo;
import com.metabuild.platform.notification.api.cmd.WeChatMiniBindCmd;
import com.metabuild.platform.notification.api.cmd.WeChatMpBindCmd;
import com.metabuild.platform.notification.config.WeChatProperties;
import com.metabuild.schema.tables.records.MbUserWechatBindingRecord;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 微信绑定/解绑服务。
 *
 * <p>公众号绑定：OAuth 网页授权 + state CSRF 防护。
 * <p>小程序绑定：wx.login() code 换 openId。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WeChatBindingService {

    private static final Logger log = LoggerFactory.getLogger(WeChatBindingService.class);

    private static final String STATE_KEY_PREFIX = "mb:wechat:state:";
    private static final Duration STATE_TTL = Duration.ofMinutes(5);

    private static final String MP_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code";
    private static final String MP_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s&lang=zh_CN";
    private static final String MINI_SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code";

    private final WeChatProperties weChatProperties;
    private final WeChatBindingRepository bindingRepository;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;
    private final StringRedisTemplate redisTemplate;
    private final Clock clock;
    private final RestTemplate restTemplate;

    /**
     * 生成公众号 OAuth state（存 Redis，TTL 5 分钟）。
     *
     * @return state 值
     */
    public String generateMpOAuthState() {
        String state = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(STATE_KEY_PREFIX + state, currentUser.userId().toString(), STATE_TTL);
        return state;
    }

    /**
     * 公众号绑定（OAuth 授权回调）。
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public WeChatBindingVo bindMp(WeChatMpBindCmd cmd) {
        // 1. 校验 state（CSRF 防护）
        String stateKey = STATE_KEY_PREFIX + cmd.state();
        String storedUserId = redisTemplate.opsForValue().get(stateKey);
        if (storedUserId == null || !storedUserId.equals(currentUser.userId().toString())) {
            throw new BusinessException(NotificationErrorCodes.WECHAT_STATE_INVALID);
        }
        // 一次性使用，立即删除
        redisTemplate.delete(stateKey);

        WeChatProperties.MpConfig mp = weChatProperties.mp();

        // 2. code 换 access_token + openid
        String tokenUrl = String.format(MP_TOKEN_URL, mp.appId(), mp.appSecret(), cmd.code());
        Map<String, Object> tokenResp = restTemplate.getForObject(tokenUrl, Map.class);
        if (tokenResp == null || !tokenResp.containsKey("openid")) {
            log.warn("公众号 code 换 token 失败: userId={}, response={}", currentUser.userId(), tokenResp);
            throw new BusinessException(NotificationErrorCodes.MP_TOKEN_EXCHANGE_FAILED);
        }
        String accessToken = (String) tokenResp.get("access_token");
        String openId = (String) tokenResp.get("openid");
        String unionId = (String) tokenResp.get("unionid");

        // 3. 获取用户信息
        String userinfoUrl = String.format(MP_USERINFO_URL, accessToken, openId);
        Map<String, Object> userInfo = restTemplate.getForObject(userinfoUrl, Map.class);
        String nickname = userInfo != null ? (String) userInfo.get("nickname") : null;
        String avatarUrl = userInfo != null ? (String) userInfo.get("headimgurl") : null;

        // 4. 写入绑定记录（UPSERT）
        MbUserWechatBindingRecord record = new MbUserWechatBindingRecord();
        record.setId(idGenerator.nextId());
        record.setTenantId(currentUser.tenantId());
        record.setUserId(currentUser.userId());
        record.setPlatform("MP");
        record.setAppId(mp.appId());
        record.setOpenId(openId);
        record.setUnionId(unionId);
        record.setNickname(nickname);
        record.setAvatarUrl(avatarUrl);
        record.setBoundAt(OffsetDateTime.now(clock));
        bindingRepository.insert(record);

        log.info("公众号绑定成功: userId={}, openId={}", currentUser.userId(), openId);

        return new WeChatBindingVo(record.getId(), "MP", mp.appId(), openId, nickname, avatarUrl, record.getBoundAt());
    }

    /**
     * 小程序绑定（wx.login code 换 openId）。
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public WeChatBindingVo bindMini(WeChatMiniBindCmd cmd) {
        WeChatProperties.MiniConfig mini = weChatProperties.mini();

        // code 换 openid + session_key
        String sessionUrl = String.format(MINI_SESSION_URL, mini.appId(), mini.appSecret(), cmd.code());
        Map<String, Object> sessionResp = restTemplate.getForObject(sessionUrl, Map.class);
        if (sessionResp == null || !sessionResp.containsKey("openid")) {
            log.warn("小程序 code 换 session 失败: userId={}, response={}", currentUser.userId(), sessionResp);
            throw new BusinessException(NotificationErrorCodes.MINI_SESSION_EXCHANGE_FAILED);
        }
        String openId = (String) sessionResp.get("openid");
        String unionId = (String) sessionResp.get("unionid");

        // 写入绑定记录（UPSERT）
        MbUserWechatBindingRecord record = new MbUserWechatBindingRecord();
        record.setId(idGenerator.nextId());
        record.setTenantId(currentUser.tenantId());
        record.setUserId(currentUser.userId());
        record.setPlatform("MINI");
        record.setAppId(mini.appId());
        record.setOpenId(openId);
        record.setUnionId(unionId);
        record.setBoundAt(OffsetDateTime.now(clock));
        bindingRepository.insert(record);

        log.info("小程序绑定成功: userId={}, openId={}", currentUser.userId(), openId);

        return new WeChatBindingVo(record.getId(), "MINI", mini.appId(), openId, null, null, record.getBoundAt());
    }

    /**
     * 解绑微信。
     */
    @Transactional
    public void unbind(String platform) {
        if (!"MP".equals(platform) && !"MINI".equals(platform)) {
            throw new BusinessException(NotificationErrorCodes.WECHAT_PLATFORM_INVALID, platform);
        }
        String appId = "MP".equals(platform) ? weChatProperties.mp().appId() : weChatProperties.mini().appId();
        boolean deleted = bindingRepository.unbind(currentUser.userId(), platform, appId, currentUser.tenantId());
        if (!deleted) {
            throw new NotFoundException(NotificationErrorCodes.WECHAT_BINDING_NOT_FOUND);
        }
        log.info("微信解绑成功: userId={}, platform={}", currentUser.userId(), platform);
    }

    /**
     * 查询当前用户的微信绑定状态。
     */
    public List<WeChatBindingVo> myBindings() {
        return bindingRepository.findByUserId(currentUser.userId(), currentUser.tenantId());
    }
}
