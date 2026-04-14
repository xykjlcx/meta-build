package com.metabuild.admin.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI（Swagger）配置。
 * 注册 Bearer JWT 安全方案，全局要求认证。
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI metaBuildOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Meta-Build API")
                        .version("v1")
                        .description("AI 时代的可定制全栈技术底座")
                        .license(new License().name("MIT")))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
