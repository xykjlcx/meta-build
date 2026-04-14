package com.metabuild.platform.config.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.config.api.dto.ConfigResponse;
import com.metabuild.platform.config.api.dto.ConfigSetRequest;
import com.metabuild.platform.config.domain.ConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 系统配置管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/configs")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;

    @GetMapping
    @RequirePermission("config:config:list")
    public PageResult<ConfigResponse> list(PageQuery query) {
        return configService.list(query);
    }

    @GetMapping("/{key}")
    @RequirePermission("config:config:detail")
    public ConfigResponse getByKey(@PathVariable("key") String configKey) {
        return configService.getByKey(configKey);
    }

    @PutMapping
    @RequirePermission("config:config:set")
    public void set(@Valid @RequestBody ConfigSetRequest request) {
        configService.set(request);
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("config:config:delete")
    public void delete(@PathVariable("key") String configKey) {
        configService.deleteByKey(configKey);
    }
}
