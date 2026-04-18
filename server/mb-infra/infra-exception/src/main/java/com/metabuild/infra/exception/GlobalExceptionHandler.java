package com.metabuild.infra.exception;

import cn.dev33.satoken.exception.DisableServiceException;
import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import cn.dev33.satoken.exception.NotRoleException;
import com.metabuild.common.exception.CommonErrorCodes;
import com.metabuild.common.exception.MetaBuildException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * 全局异常处理：MetaBuildException → ProblemDetail，覆盖业务异常、校验失败、乐观锁冲突、Sa-Token 认证/授权异常。
 */
@Slf4j
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * 处理 MetaBuildException（BusinessException / NotFoundException / ForbiddenException 等）。
     */
    @ExceptionHandler(MetaBuildException.class)
    public ProblemDetail handleMetaBuild(MetaBuildException ex) {
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(ex.getCode(), ex.getArgs(), ex.getCode(), locale);

        var pd = ProblemDetail.forStatus(ex.getHttpStatus());
        pd.setTitle(HttpStatus.valueOf(ex.getHttpStatus()).getReasonPhrase());
        pd.setDetail(message);
        pd.setType(URI.create("urn:metabuild:error:" + ex.getCode()));
        pd.setProperty("code", ex.getCode());
        pd.setProperty("traceId", MDC.get("traceId"));

        if (ex.getHttpStatus() >= 500) {
            log.error("系统异常 [{}]: {}", ex.getCode(), message, ex);
        } else {
            log.warn("业务异常 [{}]: {}", ex.getCode(), message);
        }
        return pd;
    }

    /**
     * 处理参数校验失败（@Valid）。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        var locale = LocaleContextHolder.getLocale();
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> Map.of(
                "field", fe.getField(),
                "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid"
            ))
            .toList();
        String message = messageSource.getMessage(CommonErrorCodes.VALIDATION, null, CommonErrorCodes.VALIDATION, locale);

        var pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle(HttpStatus.BAD_REQUEST.getReasonPhrase());
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.VALIDATION);
        pd.setProperty("errors", errors);
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }

    /**
     * 处理 jOOQ 乐观锁冲突（DataChangedException）。
     */
    @ExceptionHandler(org.jooq.exception.DataChangedException.class)
    public ProblemDetail handleOptimisticLock(org.jooq.exception.DataChangedException ex) {
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(CommonErrorCodes.OPTIMISTIC_LOCK, null, "数据已被修改，请刷新后重试", locale);

        var pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        pd.setTitle("Conflict");
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.OPTIMISTIC_LOCK);
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }

    /**
     * 处理 Sa-Token 未登录异常。
     */
    @ExceptionHandler(NotLoginException.class)
    public ProblemDetail handleNotLogin(NotLoginException ex) {
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(CommonErrorCodes.AUTH_UNAUTHORIZED, null, "请先登录", locale);

        var pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        pd.setTitle("Unauthorized");
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.AUTH_UNAUTHORIZED);
        pd.setProperty("traceId", MDC.get("traceId"));
        log.warn("认证失败 [{}]: {}", CommonErrorCodes.AUTH_UNAUTHORIZED, ex.getMessage());
        return pd;
    }

    /**
     * 处理 Sa-Token 无权限异常。
     */
    @ExceptionHandler(NotPermissionException.class)
    public ProblemDetail handleNotPermission(NotPermissionException ex) {
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(CommonErrorCodes.AUTH_FORBIDDEN, null, "无操作权限", locale);

        var pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setTitle("Forbidden");
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.AUTH_FORBIDDEN);
        pd.setProperty("traceId", MDC.get("traceId"));
        log.warn("权限拒绝 [{}]: permission={}", CommonErrorCodes.AUTH_FORBIDDEN, ex.getPermission());
        return pd;
    }

    /**
     * 处理 Sa-Token 账号封禁异常（DisableServiceException）→ 403 Forbidden。
     */
    @ExceptionHandler(DisableServiceException.class)
    public ProblemDetail handleDisableService(DisableServiceException ex) {
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(CommonErrorCodes.AUTH_ACCOUNT_DISABLED, null, "账号已被封禁", locale);

        var pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setTitle("Forbidden");
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.AUTH_ACCOUNT_DISABLED);
        pd.setProperty("disableTime", ex.getDisableTime());
        pd.setProperty("traceId", MDC.get("traceId"));
        log.warn("账号封禁 [{}]: service={}, level={}", CommonErrorCodes.AUTH_ACCOUNT_DISABLED, ex.getService(), ex.getLevel());
        return pd;
    }

    /**
     * 处理 Sa-Token 无角色异常。
     */
    @ExceptionHandler(NotRoleException.class)
    public ProblemDetail handleNotRole(NotRoleException ex) {
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(CommonErrorCodes.AUTH_FORBIDDEN, null, "无操作权限", locale);

        var pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setTitle("Forbidden");
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.AUTH_FORBIDDEN);
        pd.setProperty("traceId", MDC.get("traceId"));
        log.warn("角色拒绝 [{}]: role={}", CommonErrorCodes.AUTH_FORBIDDEN, ex.getRole());
        return pd;
    }

    /**
     * 未定义路由 / 静态资源缺失 → 404（防止被 handleGeneral 吞成 500，违反 HTTP 语义）。
     * 典型触发场景：客户端打错 URL、废弃端点仍有调用、禁用的 springdoc 被访问。
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail handleNoResource(NoResourceFoundException ex) {
        var pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        pd.setTitle(HttpStatus.NOT_FOUND.getReasonPhrase());
        pd.setDetail("资源不存在");
        pd.setProperty("code", CommonErrorCodes.SYSTEM_NOT_FOUND);
        pd.setProperty("traceId", MDC.get("traceId"));
        log.debug("资源不存在: {}", ex.getResourcePath());
        return pd;
    }

    /**
     * 通用兜底：隐藏堆栈，记录完整日志。
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex) {
        log.error("未处理异常: {}", ex.getMessage(), ex);
        var locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage(CommonErrorCodes.SYSTEM_INTERNAL, null, CommonErrorCodes.SYSTEM_INTERNAL, locale);

        var pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setTitle(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
        pd.setDetail(message);
        pd.setProperty("code", CommonErrorCodes.SYSTEM_INTERNAL);
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }
}
