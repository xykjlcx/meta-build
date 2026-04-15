package com.metabuild.platform.notification.web;

import com.metabuild.platform.notification.api.vo.WeChatBindingVo;
import com.metabuild.platform.notification.api.cmd.WeChatMiniBindCmd;
import com.metabuild.platform.notification.api.cmd.WeChatMpBindCmd;
import com.metabuild.platform.notification.domain.binding.WeChatBindingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 微信绑定/解绑 API。
 *
 * <p>已登录用户才能操作（走全局 SaInterceptor 认证），无需额外权限注解。
 */
@RestController
@RequestMapping("/api/v1/wechat")
@RequiredArgsConstructor
@Tag(name = "微信绑定", description = "微信公众号/小程序绑定解绑")
public class WeChatBindingController {

    private final WeChatBindingService bindingService;

    @GetMapping("/mp/oauth-state")
    @Operation(summary = "生成公众号 OAuth state", description = "返回 state 值，前端拼接微信授权 URL")
    public Map<String, String> generateMpOAuthState() {
        String state = bindingService.generateMpOAuthState();
        return Map.of("state", state);
    }

    @PostMapping("/bind-mp")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "公众号绑定", description = "微信 OAuth 授权回调后，用 code + state 完成绑定")
    public WeChatBindingVo bindMp(@Valid @RequestBody WeChatMpBindCmd cmd) {
        return bindingService.bindMp(cmd);
    }

    @PostMapping("/bind-mini")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "小程序绑定", description = "wx.login() 获取 code 后完成绑定")
    public WeChatBindingVo bindMini(@Valid @RequestBody WeChatMiniBindCmd cmd) {
        return bindingService.bindMini(cmd);
    }

    @DeleteMapping("/unbind/{platform}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "解绑微信", description = "解绑指定平台（MP/MINI）的微信绑定关系")
    public void unbind(@PathVariable String platform) {
        bindingService.unbind(platform);
    }

    @GetMapping("/bindings")
    @Operation(summary = "查询我的微信绑定", description = "返回当前用户的全部微信绑定关系")
    public List<WeChatBindingVo> myBindings() {
        return bindingService.myBindings();
    }
}
