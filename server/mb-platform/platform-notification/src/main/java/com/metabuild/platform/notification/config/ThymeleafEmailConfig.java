package com.metabuild.platform.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

/**
 * Thymeleaf 邮件模板引擎配置。
 *
 * <p>不使用 spring-boot-starter-thymeleaf（会全局启用视图解析器），
 * 手动创建 SpringTemplateEngine，专用于邮件 HTML 模板渲染。
 */
@Configuration
public class ThymeleafEmailConfig {

    @Bean
    public SpringTemplateEngine emailTemplateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(true);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }
}
