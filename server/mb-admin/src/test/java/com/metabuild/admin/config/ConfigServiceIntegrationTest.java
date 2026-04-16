package com.metabuild.admin.config;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.platform.config.api.ConfigErrorCodes;
import com.metabuild.platform.config.domain.ConfigService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestSecurityConfig.class)
class ConfigServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ConfigService configService;

    @Test
    void getByKey_should_throw_not_found_when_missing() {
        assertThatThrownBy(() -> configService.getByKey("missing.config"))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(ConfigErrorCodes.ITEM_NOT_FOUND);
    }

    @Test
    void deleteByKey_should_throw_not_found_when_missing() {
        assertThatThrownBy(() -> configService.deleteByKey("missing.config"))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(ConfigErrorCodes.ITEM_NOT_FOUND);
    }
}
