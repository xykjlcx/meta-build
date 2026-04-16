package com.metabuild.admin.notification;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.notification.api.NotificationErrorCodes;
import com.metabuild.platform.notification.api.cmd.WeChatMpBindCmd;
import com.metabuild.platform.notification.domain.binding.WeChatBindingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestSecurityConfig.class)
class WeChatBindingServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private WeChatBindingService weChatBindingService;

    @Test
    void bindMp_should_throw_business_exception_when_state_invalid() {
        assertThatThrownBy(() -> weChatBindingService.bindMp(new WeChatMpBindCmd("code", "invalid-state")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining(NotificationErrorCodes.WECHAT_STATE_INVALID);
    }

    @Test
    void unbind_should_throw_business_exception_when_platform_invalid() {
        assertThatThrownBy(() -> weChatBindingService.unbind("OTHER"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining(NotificationErrorCodes.WECHAT_PLATFORM_INVALID);
    }

    @Test
    void unbind_should_throw_not_found_when_binding_missing() {
        assertThatThrownBy(() -> weChatBindingService.unbind("MP"))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(NotificationErrorCodes.WECHAT_BINDING_NOT_FOUND);
    }
}
