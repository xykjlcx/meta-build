package com.metabuild.platform.notification.domain.channel;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationErrorCodes;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.WeChatProperties;
import com.metabuild.platform.notification.domain.binding.WeChatBindingRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * 微信小程序订阅消息渠道。
 *
 * <p>通过微信小程序 API 发送订阅消息。未配置 appId/appSecret 时自动跳过。
 * 未绑定小程序的用户静默跳过（不报错）。
 *
 * <p>用户需在小程序端主动订阅（一次性订阅 or 长期订阅）。
 */
@Component
@RequiredArgsConstructor
public class WeChatMiniChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(WeChatMiniChannel.class);

    private static final String TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";
    private static final String SEND_URL = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=%s";

    private final WeChatProperties weChatProperties;
    private final WeChatBindingRepository bindingRepository;
    private final RestTemplate restTemplate;
    private final WeChatAccessTokenCache accessTokenCache;

    @Override
    public String channelType() {
        return "WECHAT_MINI";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        WeChatProperties.MiniConfig mini = weChatProperties.mini();

        // 获取 access_token
        String accessToken = getAccessToken(mini.appId(), mini.appSecret());

        // 查询接收人的 openId
        Map<Long, String> openIdMap = bindingRepository.findOpenIds(
                "MINI", mini.appId(), message.recipientUserIds());

        if (openIdMap.isEmpty()) {
            log.info("小程序渠道：无绑定用户，跳过发送");
            return;
        }

        String title = message.params().getOrDefault("title", "通知");
        String templateId = mini.templateNotice();

        // 逐个发送订阅消息
        for (Map.Entry<Long, String> entry : openIdMap.entrySet()) {
            try {
                Integer errcode = sendSubscribeMessage(accessToken, entry.getValue(), templateId, title);
                if (errcode != null && (errcode == 40001 || errcode == 42001)) {
                    accessTokenCache.invalidate(cacheKey(mini.appId()));
                    accessToken = getAccessToken(mini.appId(), mini.appSecret());
                    sendSubscribeMessage(accessToken, entry.getValue(), templateId, title);
                }
                log.debug("小程序订阅消息发送成功: userId={}, openId={}", entry.getKey(), entry.getValue());
            } catch (Exception e) {
                log.error("小程序订阅消息发送失败: userId={}, error={}", entry.getKey(), e.getMessage());
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        return weChatProperties.mini().isConfigured()
                && !weChatProperties.mini().templateNotice().isBlank();
    }

    @Override
    public Duration defaultTimeout() {
        return Duration.ofSeconds(10);
    }

    private String cacheKey(String appId) {
        return "MINI:" + appId;
    }

    private String getAccessToken(String appId, String appSecret) {
        return accessTokenCache.getOrLoad(cacheKey(appId), () -> fetchAccessToken(appId, appSecret));
    }

    @SuppressWarnings("unchecked")
    private String fetchAccessToken(String appId, String appSecret) {
        String url = String.format(TOKEN_URL, appId, appSecret);
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("access_token")) {
            throw new NotificationException(NotificationErrorCodes.MINI_ACCESS_TOKEN_FAILED);
        }
        return (String) response.get("access_token");
    }

    @SuppressWarnings("unchecked")
    private Integer sendSubscribeMessage(String accessToken, String openId, String templateId, String title) {
        String url = String.format(SEND_URL, accessToken);

        Map<String, Object> body = new HashMap<>();
        body.put("touser", openId);
        body.put("template_id", templateId);
        body.put("page", "/pages/notice/detail");
        Map<String, Object> data = new HashMap<>();
        data.put("thing1", Map.of("value", title));
        data.put("thing2", Map.of("value", "通知公告"));
        body.put("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
        if (response == null) {
            return null;
        }
        Object errcode = response.get("errcode");
        return errcode instanceof Number n ? n.intValue() : null;
    }
}
