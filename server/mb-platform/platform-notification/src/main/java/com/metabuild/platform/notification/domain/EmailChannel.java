package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.List;

import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 邮件通知渠道。
 *
 * <p>使用 JavaMailSender + Thymeleaf 模板发送邮件。
 * SMTP 配置通过环境变量注入，未配置时 supports() 返回 false，跳过该渠道。
 */
@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailChannel.class);

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine emailTemplateEngine;
    private final DSLContext dsl;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${mb.app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Override
    public String channelType() {
        return "EMAIL";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        String title = message.params().getOrDefault("title", "通知");
        String summary = message.params().getOrDefault("summary", "您收到一条新通知，请及时查看。");
        String viewUrl = baseUrl + "/notices/" + message.referenceId();

        // 渲染邮件模板
        Context ctx = new Context();
        ctx.setVariable("title", title);
        ctx.setVariable("summary", summary);
        ctx.setVariable("viewUrl", viewUrl);
        String htmlContent = emailTemplateEngine.process("notice_published", ctx);

        // 查询接收人邮箱
        List<EmailRecipient> recipients = dsl.select(MB_IAM_USER.ID, MB_IAM_USER.EMAIL)
                .from(MB_IAM_USER)
                .where(MB_IAM_USER.ID.in(message.recipientUserIds()))
                .and(MB_IAM_USER.EMAIL.isNotNull())
                .and(MB_IAM_USER.EMAIL.ne(""))
                .fetch(r -> new EmailRecipient(r.get(MB_IAM_USER.ID), r.get(MB_IAM_USER.EMAIL)));

        // 逐个发送（避免单个邮箱异常影响其他接收人）
        for (EmailRecipient recipient : recipients) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(recipient.email());
                helper.setSubject("[Meta-Build] 新公告：" + title);
                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                log.debug("邮件发送成功: to={}, subject={}", recipient.email(), title);
            } catch (MessagingException e) {
                log.error("邮件发送失败: to={}, error={}", recipient.email(), e.getMessage());
                // 单个邮箱失败不中断，继续发送其他接收人
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        // SMTP 未配置时跳过
        return mailHost != null && !mailHost.isBlank();
    }

    /**
     * 邮件接收人（内部使用）。
     */
    private record EmailRecipient(Long id, String email) {}
}
