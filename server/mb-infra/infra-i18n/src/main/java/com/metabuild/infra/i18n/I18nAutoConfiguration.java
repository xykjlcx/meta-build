package com.metabuild.infra.i18n;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/**
 * 国际化自动配置
 * <p>
 * 注册 MessageSource 和 LocaleResolver，覆盖共享层、platform 模块与 business 模块的消息文件。
 * 通过 Accept-Language 请求头自动切换语言，默认简体中文。
 * after = WebMvcAutoConfiguration 确保在 Spring MVC 注册 localeResolver 之后执行，
 * @ConditionalOnMissingBean 防止重复注册。
 */
@AutoConfiguration(after = WebMvcAutoConfiguration.class)
@EnableConfigurationProperties(MbI18nProperties.class)
public class I18nAutoConfiguration {

    /**
     * 注册消息源，覆盖共享层、platform 模块与 business 模块的消息文件。
     */
    @Bean
    public MessageSource messageSource(MbI18nProperties props) {
        var source = new ReloadableResourceBundleMessageSource();
        // 覆盖所有 platform 模块的消息文件
        source.setBasenames(
                "classpath:messages/messages",
                "classpath:messages/iam",
                "classpath:messages/file",
                "classpath:messages/notice",
                "classpath:messages/notification",
                "classpath:messages/dict",
                "classpath:messages/config"
        );
        source.setDefaultEncoding("UTF-8");
        source.setDefaultLocale(props.defaultLocale());
        // key 作为兜底消息，避免 NoSuchMessageException
        source.setUseCodeAsDefaultMessage(true);
        return source;
    }

    /**
     * 注册基于 Accept-Language 的区域解析器。
     * 使用 @ConditionalOnMissingBean 避免与 Spring MVC 自动配置的 localeResolver 冲突。
     */
    @Bean
    @ConditionalOnMissingBean(LocaleResolver.class)
    public LocaleResolver localeResolver(MbI18nProperties props) {
        var resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(props.defaultLocale());
        resolver.setSupportedLocales(props.supportedLocales());
        return resolver;
    }
}
