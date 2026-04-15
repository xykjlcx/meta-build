package com.metabuild.admin.notification;

import com.metabuild.admin.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Actuator 健康检查集成测试。
 */
@AutoConfigureMockMvc
@DisplayName("Actuator 健康检查集成测试")
class HealthIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    @Qualifier("notificationMailHealthIndicator")
    private HealthIndicator mailHealthIndicator;

    @Test
    @DisplayName("SMTP 未配置时邮件健康检查返回 UP")
    void mailHealth_upWhenSmtpNotConfigured() {
        assertThat(mailHealthIndicator.health().getStatus()).isEqualTo(Status.UP);
        assertThat(mailHealthIndicator.health().getDetails())
                .containsEntry("enabled", false)
                .containsEntry("reason", "SMTP not configured");
    }

    @Test
    @DisplayName("SMTP 未配置时整体健康检查仍返回 UP")
    void overallHealth_upWhenSmtpNotConfigured() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
