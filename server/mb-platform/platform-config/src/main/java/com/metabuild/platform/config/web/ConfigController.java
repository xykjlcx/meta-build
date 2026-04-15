package com.metabuild.platform.config.web;

import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.web.pagination.PageRequestDto;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.config.api.vo.ConfigVo;
import com.metabuild.platform.config.api.cmd.ConfigSetCmd;
import com.metabuild.platform.config.domain.ConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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
    private final PaginationPolicy paginationPolicy;

    @GetMapping
    @RequirePermission("config:config:list")
    public PageResult<ConfigVo> list(@ParameterObject PageRequestDto request) {
        return configService.list(paginationPolicy.normalize(request));
    }

    @GetMapping("/{key}")
    @RequirePermission("config:config:detail")
    public ConfigVo getByKey(@PathVariable("key") String configKey) {
        return configService.getByKey(configKey);
    }

    @PutMapping
    @RequirePermission("config:config:set")
    public void set(@Valid @RequestBody ConfigSetCmd request) {
        configService.set(request);
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("config:config:delete")
    public void delete(@PathVariable("key") String configKey) {
        configService.deleteByKey(configKey);
    }
}
