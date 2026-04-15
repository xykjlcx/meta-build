package com.metabuild.platform.iam.domain.auth;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.TooManyRequestsException;
import com.metabuild.common.exception.UnauthorizedException;
import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.DataScope;
import com.metabuild.common.security.DataScopeType;
import com.metabuild.common.security.LoginResult;
import com.metabuild.common.security.SessionData;
import com.metabuild.infra.captcha.CaptchaService;
import com.metabuild.platform.iam.api.AuthApi;
import com.metabuild.platform.iam.api.dto.LoginCommand;
import com.metabuild.platform.iam.domain.dept.DeptRepository;
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
import java.util.HashSet;
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
    private final DeptRepository deptRepository;
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
    public LoginResult login(LoginCommand request) {
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
            throw new TooManyRequestsException("iam.auth.tooManyFailures", delaySeconds);
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

        // 是否超管：包含 SUPER_ADMIN 角色即视为管理员
        boolean isAdmin = roleCodes.contains("SUPER_ADMIN");

        // 数据权限：取角色中最宽松的数据权限范围（简化策略）
        DataScopeType scopeType = resolveScopeType(roles);

        // 根据数据权限类型填充对应的部门 ID 集合
        Set<Long> scopeDeptIds = resolveScopeDeptIds(scopeType, user.getDeptId(), roles);
        DataScope dataScope = new DataScope(scopeType, scopeDeptIds);

        SessionData sessionData = new SessionData(
            user.getId(),
            user.getUsername(),
            user.getDeptId(),
            user.getTenantId(),
            dataScope,
            Boolean.TRUE.equals(user.getMustChangePassword()),
            permissions,
            roleCodes,
            isAdmin
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

    /**
     * 刷新 access token。
     *
     * <p>流程：验证 refresh token → 获取 userId → 重新构建 SessionData → 重新登录（生成新 access token + 新 refresh token）。
     * Refresh token one-time use rotation，旧 token 在验证时立即删除。
     *
     * @param refreshToken 客户端持有的 refresh token
     * @return 包含新 access token 和新 refresh token 的 LoginResult
     */
    @Transactional
    public LoginResult refresh(String refreshToken) {
        // 1. 验证 refresh token 并获取 userId（同时轮换，旧 token 失效）
        Long userId = authFacade.validateAndRotateRefreshToken(refreshToken);

        // 2. 查询用户，确保仍然有效
        MbIamUserRecord user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("auth.refreshTokenInvalid"));

        if (user.getStatus() == null || user.getStatus() == 0) {
            throw new BusinessException("iam.auth.userDisabled", 403);
        }

        // 3. 重建 SessionData（与登录流程保持一致）
        List<MbIamRoleRecord> roles = roleRepository.findByUserId(userId);
        Set<String> permissions = permissionService.getPermissions(userId);
        Set<String> roleCodes = permissionService.getRoles(userId);
        boolean isAdmin = roleCodes.contains("SUPER_ADMIN");
        DataScopeType scopeType = resolveScopeType(roles);
        Set<Long> scopeDeptIds = resolveScopeDeptIds(scopeType, user.getDeptId(), roles);
        DataScope dataScope = new DataScope(scopeType, scopeDeptIds);

        SessionData sessionData = new SessionData(
                userId,
                user.getUsername(),
                user.getDeptId(),
                user.getTenantId(),
                dataScope,
                Boolean.TRUE.equals(user.getMustChangePassword()),
                permissions,
                roleCodes,
                isAdmin
        );

        // 4. 重新登录（生成新 access token + 新 refresh token）
        LoginResult result = authFacade.doLogin(userId, sessionData);
        log.info("Token 刷新成功: userId={}", userId);
        return result;
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

    /**
     * 根据数据权限类型填充需要的部门 ID 集合。
     * <ul>
     *   <li>ALL / SELF：空集合（ALL 无需过滤，SELF 按 created_by 过滤）</li>
     *   <li>OWN_DEPT：仅用户自己的部门</li>
     *   <li>OWN_DEPT_AND_CHILD：用户部门 + 所有子孙部门（迭代查询）</li>
     *   <li>CUSTOM_DEPT：从 mb_iam_role_data_scope_dept 读取配置的部门</li>
     * </ul>
     */
    private Set<Long> resolveScopeDeptIds(DataScopeType scopeType, Long userDeptId,
                                          List<MbIamRoleRecord> roles) {
        return switch (scopeType) {
            case ALL, SELF -> Set.of();
            case OWN_DEPT -> userDeptId != null ? Set.of(userDeptId) : Set.of();
            case OWN_DEPT_AND_CHILD -> {
                if (userDeptId == null) yield Set.of();
                // 使用 WITH RECURSIVE CTE 一次性查询，避免 N+1
                yield new HashSet<>(deptRepository.findAllChildDeptIds(userDeptId));
            }
            case CUSTOM_DEPT -> {
                // 聚合用户所有角色对应的自定义部门 ID
                List<Long> roleIds = roles.stream().map(MbIamRoleRecord::getId).toList();
                if (roleIds.isEmpty()) yield Set.of();
                yield new HashSet<>(roleRepository.findDataScopeDeptIds(roleIds));
            }
        };
    }

}
