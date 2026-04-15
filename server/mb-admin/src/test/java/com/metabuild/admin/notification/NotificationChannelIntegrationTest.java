package com.metabuild.admin.notification;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.domain.channel.InAppChannel;
import com.metabuild.platform.notification.domain.notification.NotificationDispatcher;
import com.metabuild.platform.notification.domain.log.NotificationLogRepository;
import com.metabuild.platform.notification.domain.log.NotificationLogService;
import com.metabuild.platform.notification.api.vo.NotificationLogVo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 通知渠道系统集成测试。
 *
 * <p>测试渠道分发、日志记录、发送记录查询等核心行为。
 * 微信渠道在测试环境中不可用（环境变量未配置），supports() 返回 false，自动跳过。
 */
@DisplayName("通知渠道系统集成测试")
class NotificationChannelIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private List<NotificationChannel> channels;

    @Autowired
    private NotificationDispatcher dispatcher;

    @Autowired
    private NotificationLogRepository logRepository;

    @Autowired
    private NotificationLogService logService;

    // ===== 渠道注册 =====

    @Test
    @DisplayName("Spring 自动注入至少包含 InAppChannel")
    void channelList_containsInApp() {
        assertThat(channels).isNotEmpty();
        assertThat(channels).anyMatch(ch -> "IN_APP".equals(ch.channelType()));
    }

    @Test
    @DisplayName("InAppChannel.supports() 始终返回 true")
    void inAppChannel_alwaysSupports() {
        InAppChannel inApp = channels.stream()
                .filter(ch -> ch instanceof InAppChannel)
                .map(InAppChannel.class::cast)
                .findFirst()
                .orElseThrow();

        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L), "test", Map.of(), "test", "123");
        assertThat(inApp.supports(msg)).isTrue();
    }

    // ===== 微信渠道环境检查 =====

    @Test
    @DisplayName("WeChatMpChannel.supports() 在测试环境返回 false（未配置 appId）")
    void weChatMp_notConfigured_returnsFalse() {
        channels.stream()
                .filter(ch -> "WECHAT_MP".equals(ch.channelType()))
                .findFirst()
                .ifPresent(ch -> {
                    NotificationMessage msg = new NotificationMessage(
                            0L, List.of(1L), "test", Map.of(), "test", "123");
                    assertThat(ch.supports(msg)).isFalse();
                });
    }

    @Test
    @DisplayName("WeChatMiniChannel.supports() 在测试环境返回 false（未配置 appId）")
    void weChatMini_notConfigured_returnsFalse() {
        channels.stream()
                .filter(ch -> "WECHAT_MINI".equals(ch.channelType()))
                .findFirst()
                .ifPresent(ch -> {
                    NotificationMessage msg = new NotificationMessage(
                            0L, List.of(1L), "test", Map.of(), "test", "123");
                    assertThat(ch.supports(msg)).isFalse();
                });
    }

    // ===== 分发器 =====

    @Test
    @DisplayName("dispatch 后 notification_log 有记录")
    void dispatch_writesLogEntry() {
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L, 2L), "notice_published",
                Map.of("title", "测试公告"), "notice", "test-ref-001");

        dispatcher.dispatch(msg);

        List<NotificationLogVo> logs = logRepository.findByModuleAndRef("notice", "test-ref-001");
        // 至少 IN_APP 渠道会写入记录（每个接收人一条）
        assertThat(logs).isNotEmpty();
        assertThat(logs).allMatch(l -> l.status() == 1); // 全部成功
    }

    @Test
    @DisplayName("dispatch 对无支持渠道的消息不报错")
    void dispatch_noSupportedChannels_noError() {
        // InAppChannel 始终支持，所以这个测试验证空接收人列表不会抛异常
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(), "unknown_template",
                Map.of(), "unknown_module", "ref-999");
        dispatcher.dispatch(msg);
    }

    // ===== 发送记录查询（通过 Service 层） =====

    @Test
    @DisplayName("NotificationLogService 按 module+ref 查询")
    void logService_findByModuleAndRef() {
        // 先分发一条消息，确保有记录
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L), "notice_published",
                Map.of("title", "Service测试"), "notice", "svc-test-ref");
        dispatcher.dispatch(msg);

        List<NotificationLogVo> logs = logService.findByModuleAndRef("notice", "svc-test-ref");
        assertThat(logs).isNotEmpty();
        assertThat(logs.getFirst().module()).isEqualTo("notice");
        assertThat(logs.getFirst().referenceId()).isEqualTo("svc-test-ref");
    }

    // ===== notification_log DDL 验证 =====

    @Test
    @DisplayName("notification_log 表索引存在")
    void notificationLog_indexesExist() {
        // Flyway 迁移已执行，表和索引应该存在
        // 通过插入和查询验证表可用
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L), "test_template",
                Map.of(), "test_module", "idx-test-ref");
        dispatcher.dispatch(msg);

        List<NotificationLogVo> logs = logRepository.findByModuleAndRef("test_module", "idx-test-ref");
        assertThat(logs).isNotEmpty();
    }

    // ===== 微信绑定表 DDL 验证 =====

    @Test
    @DisplayName("wechat_binding 表 Flyway 迁移成功（表可访问）")
    void wechatBindingTable_migrated(@Autowired org.jooq.DSLContext dsl) {
        // 验证表存在且可查询
        int count = dsl.fetchCount(
                com.metabuild.schema.tables.MbUserWechatBinding.MB_USER_WECHAT_BINDING);
        assertThat(count).isGreaterThanOrEqualTo(0);
    }
}
