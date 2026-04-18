package com.metabuild.platform.notification.domain.channel;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.EmailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Duration;
import java.util.Map;

/**
 * 邮件通知渠道。
 *
 * <p>使用 JavaMailSender + Thymeleaf 模板发送邮件。
 * SMTP 配置通过 {@link EmailProperties} 注入，未配置时 supports() 返回 false，跳过该渠道。
 */
@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailChannel.class);

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine emailTemplateEngine;
    private final EmailRecipientRepository emailRecipientRepository;
    private final EmailProperties emailProperties;

    @Override
    public String channelType() {
        return "EMAIL";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        String title = message.params().getOrDefault("title", "通知");
        String summary = message.params().getOrDefault("summary", "您收到一条新通知，请及时查看。");
        String viewUrl = emailProperties.baseUrl() + "/notices/" + message.referenceId();

        // 渲染邮件模板
        Context ctx = new Context();
        ctx.setVariable("title", title);
        ctx.setVariable("summary", summary);
        ctx.setVariable("viewUrl", viewUrl);
        String htmlContent = emailTemplateEngine.process("notice_published", ctx);

        // 查询接收人邮箱
        Map<Long, String> emailMap = emailRecipientRepository.findEmailsByUserIds(message.recipientUserIds());

        // 逐个发送（避免单个邮箱异常影响其他接收人）
        for (Map.Entry<Long, String> entry : emailMap.entrySet()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(emailProperties.from());
                helper.setTo(entry.getValue());
                helper.setSubject("[Meta-Build] 新公告：" + title);
                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                log.debug("邮件发送成功: to={}, subject={}", entry.getValue(), title);
            } catch (MessagingException e) {
                log.error("邮件发送失败: to={}, error={}", entry.getValue(), e.getMessage());
                // 单个邮箱失败不中断，继续发送其他接收人
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        return emailProperties.isConfigured();
    }

    @Override
    public Duration defaultTimeout() {
        return Duration.ofSeconds(15);
    }
}
