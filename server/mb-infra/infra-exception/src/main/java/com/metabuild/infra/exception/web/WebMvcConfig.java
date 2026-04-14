package com.metabuild.infra.exception.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * MVC 扩展配置：注册 PageQueryArgumentResolver。
 */
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final MbPaginationProperties paginationProperties;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new PageQueryArgumentResolver(paginationProperties));
    }
}
