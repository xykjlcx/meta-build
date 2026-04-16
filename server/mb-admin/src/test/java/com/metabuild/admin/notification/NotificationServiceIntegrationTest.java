package com.metabuild.admin.notification;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.notification.api.NotificationErrorCodes;
import com.metabuild.platform.notification.api.cmd.NotificationCreateCmd;
import com.metabuild.platform.notification.domain.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestSecurityConfig.class)
class NotificationServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private NotificationService notificationService;

    @Test
    void markRead_should_throw_not_found_when_notification_missing() {
        assertThatThrownBy(() -> notificationService.markRead(999_999L))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(NotificationErrorCodes.NOTIFICATION_NOT_FOUND);
    }

    @Test
    void delete_should_throw_not_found_when_notification_missing() {
        assertThatThrownBy(() -> notificationService.delete(999_999L))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(NotificationErrorCodes.NOTIFICATION_NOT_FOUND);
    }

    @Test
    void create_should_return_id() {
        Long id = notificationService.create(new NotificationCreateCmd("系统通知", "hello", "SYSTEM"));

        assertThat(id).isNotNull().isPositive();
    }
}
