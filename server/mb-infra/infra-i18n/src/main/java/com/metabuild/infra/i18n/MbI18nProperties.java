package com.metabuild.infra.i18n;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Locale;

/**
 * 国际化配置属性
 * <p>
 * 配置前缀：mb.i18n
 * 默认语言：简体中文
 * 支持语言：简体中文、英语（美国）
 */
@ConfigurationProperties(prefix = "mb.i18n")
@Validated
public record MbI18nProperties(
        Locale defaultLocale,
        List<Locale> supportedLocales
) {
    public MbI18nProperties {
        if (defaultLocale == null) defaultLocale = Locale.SIMPLIFIED_CHINESE;
        if (supportedLocales == null || supportedLocales.isEmpty())
            supportedLocales = List.of(Locale.SIMPLIFIED_CHINESE, Locale.US);
    }
}
