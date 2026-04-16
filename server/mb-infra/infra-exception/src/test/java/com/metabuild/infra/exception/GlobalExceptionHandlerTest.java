package com.metabuild.infra.exception;

import com.metabuild.common.exception.CommonErrorCodes;
import com.metabuild.common.exception.TooManyRequestsException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.core.MethodParameter;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        StaticMessageSource messageSource = new StaticMessageSource();
        messageSource.addMessage(CommonErrorCodes.VALIDATION, Locale.US, "Request validation failed");
        messageSource.addMessage(CommonErrorCodes.SYSTEM_INTERNAL, Locale.US, "Internal server error, please try again later");
        messageSource.addMessage("iam.auth.tooManyFailures", Locale.US, "Retry after {0} seconds");
        handler = new GlobalExceptionHandler(messageSource);
    }

    @AfterEach
    void tearDown() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void handleValidation_should_use_localized_message() throws NoSuchMethodException {
        LocaleContextHolder.setLocale(Locale.US);
        DummyBody target = new DummyBody();
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(target, "body");
        bindingResult.addError(new FieldError("body", "name", "must not be blank"));
        MethodParameter parameter = new MethodParameter(
            DummyController.class.getDeclaredMethod("create", DummyBody.class),
            0
        );
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ProblemDetail pd = handler.handleValidation(ex);

        assertThat(pd.getStatus()).isEqualTo(400);
        assertThat(pd.getDetail()).isEqualTo("Request validation failed");
        assertThat(pd.getProperties()).containsEntry("code", CommonErrorCodes.VALIDATION);
        @SuppressWarnings("unchecked")
        List<Map<String, String>> errors = (List<Map<String, String>>) pd.getProperties().get("errors");
        assertThat(errors).hasSize(1);
        assertThat(errors.getFirst().get("field")).isEqualTo("name");
    }

    @Test
    void handleGeneral_should_use_localized_message() {
        LocaleContextHolder.setLocale(Locale.US);

        ProblemDetail pd = handler.handleGeneral(new RuntimeException("boom"));

        assertThat(pd.getStatus()).isEqualTo(500);
        assertThat(pd.getDetail()).isEqualTo("Internal server error, please try again later");
        assertThat(pd.getProperties()).containsEntry("code", CommonErrorCodes.SYSTEM_INTERNAL);
    }

    @Test
    void handleMetaBuild_should_preserve_429_status() {
        LocaleContextHolder.setLocale(Locale.US);

        ProblemDetail pd = handler.handleMetaBuild(new TooManyRequestsException("iam.auth.tooManyFailures", 30));

        assertThat(pd.getStatus()).isEqualTo(429);
        assertThat(pd.getDetail()).isEqualTo("Retry after 30 seconds");
        assertThat(pd.getProperties()).containsEntry("code", "iam.auth.tooManyFailures");
    }

    @Test
    void handleIllegalArgument_should_return_400() {
        LocaleContextHolder.setLocale(Locale.US);

        ProblemDetail pd = handler.handleIllegalArgument(new IllegalArgumentException("invalid enum value"));

        assertThat(pd.getStatus()).isEqualTo(400);
        assertThat(pd.getDetail()).isEqualTo("invalid enum value");
        assertThat(pd.getProperties()).containsEntry("code", CommonErrorCodes.VALIDATION);
    }

    private static final class DummyController {
        void create(DummyBody body) {
        }
    }

    private static final class DummyBody {
        @SuppressWarnings("unused")
        private String name;
    }
}
