package com.metabuild.platform.iam.api;

/**
 * IAM 模块错误码。
 */
public final class IamErrorCodes {

    public static final String USER_NOT_FOUND = "iam.user.notFound";
    public static final String USER_USERNAME_EXISTS = "iam.user.usernameExists";

    public static final String ROLE_NOT_FOUND = "iam.role.notFound";
    public static final String ROLE_CODE_EXISTS = "iam.role.codeExists";

    public static final String DEPT_NOT_FOUND = "iam.dept.notFound";
    public static final String DEPT_HAS_CHILDREN = "iam.dept.hasChildren";
    public static final String DEPT_HAS_USERS = "iam.dept.hasUsers";

    public static final String MENU_NOT_FOUND = "iam.menu.notFound";

    public static final String AUTH_BAD_CREDENTIALS = "iam.auth.badCredentials";
    public static final String AUTH_USER_DISABLED = "iam.auth.userDisabled";
    public static final String AUTH_CAPTCHA_REQUIRED = "iam.auth.captchaRequired";
    public static final String AUTH_CAPTCHA_INVALID = "iam.auth.captchaInvalid";
    public static final String AUTH_MUST_CHANGE_PASSWORD = "iam.auth.mustChangePassword";
    public static final String AUTH_WRONG_PASSWORD = "iam.auth.wrongPassword";
    public static final String AUTH_PASSWORD_REUSED = "iam.auth.passwordReused";
    public static final String AUTH_INVALID_TOKEN = "iam.auth.invalidToken";
    public static final String AUTH_TOO_MANY_FAILURES = "iam.auth.tooManyFailures";

    public static final String PASSWORD_BLANK = "iam.password.blank";
    public static final String PASSWORD_TOO_SHORT = "iam.password.tooShort";
    public static final String PASSWORD_TOO_LONG = "iam.password.tooLong";
    public static final String PASSWORD_REQUIRE_DIGIT = "iam.password.requireDigit";
    public static final String PASSWORD_REQUIRE_LETTER = "iam.password.requireLetter";
    public static final String PASSWORD_REQUIRE_UPPERCASE = "iam.password.requireUppercase";
    public static final String PASSWORD_REQUIRE_SPECIAL = "iam.password.requireSpecial";

    private IamErrorCodes() {
    }
}
