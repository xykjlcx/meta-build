package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.WeChatProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信公众号模板消息渠道。
 *
 * <p>通过微信 API 发送模板消息。未配置 appId/appSecret 时自动跳过。
 * 未绑定公众号的用户静默跳过（不报错）。
 *
 * <p>v1 使用 RestTemplate 直接调用微信 API。
 * 如需要更完善的微信 SDK 能力（如自动刷新 access_token），
 * 可在后续版本引入 weixin-java-mp。
 */
@Component
@RequiredArgsConstructor
public class WeChatMpChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(WeChatMpChannel.class);

    private static final String TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";
    private static final String SEND_URL = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=%s";

    private final WeChatProperties weChatProperties;
    private final WeChatBindingRepository bindingRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String channelType() {
        return "WECHAT_MP";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        WeChatProperties.MpConfig mp = weChatProperties.mp();

        // 获取 access_token
        String accessToken = getAccessToken(mp.appId(), mp.appSecret());

        // 查询接收人的 openId
        Map<Long, String> openIdMap = bindingRepository.findOpenIds(
                "MP", mp.appId(), message.recipientUserIds());

        if (openIdMap.isEmpty()) {
            log.info("公众号渠道：无绑定用户，跳过发送");
            return;
        }

        String title = message.params().getOrDefault("title", "通知");
        String templateId = mp.templateNotice();

        // 逐个发送模板消息
        for (Map.Entry<Long, String> entry : openIdMap.entrySet()) {
            try {
                sendTemplateMessage(accessToken, entry.getValue(), templateId, title);
                log.debug("公众号模板消息发送成功: userId={}, openId={}", entry.getKey(), entry.getValue());
            } catch (Exception e) {
                log.error("公众号模板消息发送失败: userId={}, error={}", entry.getKey(), e.getMessage());
                // 单个用户失败不中断
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        return weChatProperties.mp().isConfigured()
                && !weChatProperties.mp().templateNotice().isBlank();
    }

    /**
     * 获取微信公众号 access_token。
     *
     * <p>v1 每次调用都请求新 token（简单实现）。
     * 生产环境应缓存 token（有效期 7200s），在 v1.5 优化。
     */
    @SuppressWarnings("unchecked")
    private String getAccessToken(String appId, String appSecret) {
        String url = String.format(TOKEN_URL, appId, appSecret);
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("access_token")) {
            String errMsg = response != null ? String.valueOf(response.get("errmsg")) : "null response";
            throw new NotificationException("获取公众号 access_token 失败: " + errMsg);
        }
        return (String) response.get("access_token");
    }

    /**
     * 发送模板消息。
     */
    private void sendTemplateMessage(String accessToken, String openId, String templateId, String title) {
        String url = String.format(SEND_URL, accessToken);

        Map<String, Object> body = new HashMap<>();
        body.put("touser", openId);
        body.put("template_id", templateId);
        Map<String, Object> data = new HashMap<>();
        data.put("first", Map.of("value", "您收到一条新公告"));
        data.put("keyword1", Map.of("value", title));
        data.put("keyword2", Map.of("value", "通知公告"));
        body.put("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        restTemplate.postForObject(url, request, Map.class);
    }
}
