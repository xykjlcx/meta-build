package com.metabuild.infra.exception.web;

import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * MVC 扩展配置：注册 PageQueryArgumentResolver。
 */
public class WebMvcConfig implements WebMvcConfigurer {

    private final MbPaginationProperties paginationProperties;

    public WebMvcConfig(MbPaginationProperties paginationProperties) {
        this.paginationProperties = paginationProperties;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new PageQueryArgumentResolver(paginationProperties));
    }
}
