package com.metabuild.platform.iam.domain.auth;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.UnauthorizedException;
import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.DataScope;
import com.metabuild.common.security.DataScopeType;
import com.metabuild.common.security.LoginResult;
import com.metabuild.common.security.SessionData;
import com.metabuild.infra.captcha.CaptchaService;
import com.metabuild.platform.iam.api.AuthApi;
import com.metabuild.platform.iam.api.dto.LoginRequest;
import com.metabuild.platform.iam.domain.permission.PermissionService;
import com.metabuild.platform.iam.domain.role.RoleRepository;
import com.metabuild.platform.iam.domain.session.LoginLogService;
import com.metabuild.platform.iam.domain.session.OnlineUserService;
import com.metabuild.platform.iam.domain.user.UserRepository;
import com.metabuild.schema.tables.records.MbIamRoleRecord;
import com.metabuild.schema.tables.records.MbIamUserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Set;

/**
 * 认证服务（登录/登出/刷新 token）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements AuthApi {

    private static final String FAIL_COUNT_KEY_PREFIX = "mb:iam:login:fail:";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionService permissionService;
    private final PasswordPolicy passwordPolicy;
    private final AuthFacade authFacade;
    private final CaptchaService captchaService;
    private final LoginLogService loginLogService;
    private final OnlineUserService onlineUserService;
    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public LoginResult login(LoginRequest request) {
        String username = request.username();
        String failKey = FAIL_COUNT_KEY_PREFIX + username;

        // 1. 检查失败次数
        int failCount = getFailCount(failKey);

        // 2. 验证码校验（失败次数达到阈值时必须提供）
        if (failCount >= passwordPolicy.captchaThreshold()) {
            if (request.captchaToken() == null || request.captchaCode() == null) {
                throw new BusinessException("iam.auth.captchaRequired", 400);
            }
            if (!captchaService.verify(request.captchaToken(), request.captchaCode())) {
                throw new BusinessException("iam.auth.captchaInvalid", 400);
            }
        }

        // 3. 登录保护：失败次数超过延迟阈值时直接拒绝，返回 429
        if (failCount >= passwordPolicy.delayThreshold()) {
            int delaySeconds = failCount >= passwordPolicy.delayThreshold() * 2
                ? passwordPolicy.longDelaySeconds()
                : passwordPolicy.shortDelaySeconds();
            throw new BusinessException("iam.auth.tooManyFailures", 429, delaySeconds);
        }

        // 4. 查询用户
        MbIamUserRecord user = userRepository.findByUsername(username)
            .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            // 增加失败次数
            incrementFailCount(failKey);
            loginLogService.recordFailure(username, "用户名或密码错误");
            throw new UnauthorizedException("iam.auth.badCredentials");
        }

        // 5. 检查用户状态
        if (user.getStatus() == null || user.getStatus() == 0) {
            loginLogService.recordFailure(username, "账号已停用");
            throw new BusinessException("iam.auth.userDisabled", 403);
        }

        // 6. 构建 SessionData
        List<MbIamRoleRecord> roles = roleRepository.findByUserId(user.getId());
        Set<String> permissions = permissionService.getPermissions(user.getId());
        Set<String> roleCodes = permissionService.getRoles(user.getId());

        // 数据权限：取角色中最宽松的数据权限范围（简化策略）
        DataScopeType scopeType = resolveScopeType(roles);
        DataScope dataScope = new DataScope(scopeType, Set.of());

        SessionData sessionData = new SessionData(
            user.getId(),
            user.getUsername(),
            user.getDeptId(),
            user.getTenantId(),
            dataScope,
            Boolean.TRUE.equals(user.getMustChangePassword())
        );

        // 7. 执行登录（mustChangePassword 标志由 AuthFacade 实现负责写入 session）
        LoginResult result = authFacade.doLogin(user.getId(), sessionData);

        // 8. 清除失败计数
        redisTemplate.delete(failKey);

        // 9. 记录登录日志
        loginLogService.recordSuccess(user.getId(), username);

        log.info("用户登录成功: userId={}, username={}", user.getId(), username);
        return result;
    }

    @Override
    public void logout() {
        authFacade.logout();
    }

    /** 获取失败次数 */
    private int getFailCount(String key) {
        String val = redisTemplate.opsForValue().get(key);
        return val == null ? 0 : Integer.parseInt(val);
    }

    /** 增加失败次数，并设置 TTL */
    private void incrementFailCount(String key) {
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, Duration.ofMinutes(passwordPolicy.failCountTtlMinutes()));
    }

    /** 从角色列表中解析最宽松的数据权限范围 */
    private DataScopeType resolveScopeType(List<MbIamRoleRecord> roles) {
        DataScopeType broadest = DataScopeType.SELF;
        for (MbIamRoleRecord role : roles) {
            String ds = role.getDataScope();
            if (ds == null) continue;
            try {
                DataScopeType type = DataScopeType.valueOf(ds);
                if (type.ordinal() < broadest.ordinal()) {
                    broadest = type;
                }
            } catch (IllegalArgumentException ignored) {
                log.warn("无效的 DataScope 值: {}", ds);
            }
        }
        return broadest;
    }
}
