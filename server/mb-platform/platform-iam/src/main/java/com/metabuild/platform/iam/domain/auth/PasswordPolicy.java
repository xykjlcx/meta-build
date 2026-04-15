package com.metabuild.platform.iam.domain.auth;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.platform.iam.api.IamErrorCodes;
import com.metabuild.platform.iam.config.MbIamPasswordProperties;
import lombok.RequiredArgsConstructor;

import java.time.Clock;
import java.time.OffsetDateTime;

/**
 * 密码策略校验器，基于 {@link MbIamPasswordProperties} 进行验证。
 */
@RequiredArgsConstructor
public class PasswordPolicy {

    private final MbIamPasswordProperties props;
    private final Clock clock;

    /**
     * 验证密码是否满足策略要求。
     * 不满足则抛出 BusinessException。
     */
    public void validate(String password) {
        if (password == null || password.isBlank()) {
            throw new BusinessException(IamErrorCodes.PASSWORD_BLANK);
        }

        int len = password.length();
        if (len < props.minLength()) {
            throw new BusinessException(IamErrorCodes.PASSWORD_TOO_SHORT, (Object) props.minLength());
        }
        if (len > props.maxLength()) {
            throw new BusinessException(IamErrorCodes.PASSWORD_TOO_LONG, (Object) props.maxLength());
        }
        if (props.requireDigit() && !containsDigit(password)) {
            throw new BusinessException(IamErrorCodes.PASSWORD_REQUIRE_DIGIT);
        }
        if (props.requireLetter() && !containsLetter(password)) {
            throw new BusinessException(IamErrorCodes.PASSWORD_REQUIRE_LETTER);
        }
        if (props.requireUppercase() && !containsUppercase(password)) {
            throw new BusinessException(IamErrorCodes.PASSWORD_REQUIRE_UPPERCASE);
        }
        if (props.requireSpecial() && !containsSpecial(password)) {
            throw new BusinessException(IamErrorCodes.PASSWORD_REQUIRE_SPECIAL);
        }
    }

    /**
     * 判断密码是否已过期。
     * maxAgeDays=0 表示永不过期。
     */
    public boolean isExpired(OffsetDateTime passwordUpdatedAt) {
        if (props.maxAgeDays() == 0) return false;
        return passwordUpdatedAt.plusDays(props.maxAgeDays()).isBefore(OffsetDateTime.now(clock));
    }

    /** 获取密码历史数量（用于防重用校验） */
    public int historyCount() {
        return props.historyCount();
    }

    /** 获取验证码触发阈值 */
    public int captchaThreshold() {
        return props.captchaThreshold();
    }

    /** 获取延迟触发阈值 */
    public int delayThreshold() {
        return props.delayThreshold();
    }

    /** 获取短延迟秒数 */
    public int shortDelaySeconds() {
        return props.shortDelaySeconds();
    }

    /** 获取长延迟秒数 */
    public int longDelaySeconds() {
        return props.longDelaySeconds();
    }

    /** 获取失败计数 TTL（分钟） */
    public int failCountTtlMinutes() {
        return props.failCountTtlMinutes();
    }

    private boolean containsDigit(String s) {
        return s.chars().anyMatch(Character::isDigit);
    }

    private boolean containsLetter(String s) {
        return s.chars().anyMatch(Character::isLetter);
    }

    private boolean containsUppercase(String s) {
        return s.chars().anyMatch(Character::isUpperCase);
    }

    private boolean containsSpecial(String s) {
        return s.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
    }
}
