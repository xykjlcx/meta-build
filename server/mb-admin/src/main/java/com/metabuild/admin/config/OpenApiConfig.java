package com.metabuild.admin.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.GlobalOpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(new Server()
                        .url("http://localhost:8080")
                        .description("Generated server url")))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }

    /**
     * 统一 operationId 命名：
     * HTTP 方法 + 路径优先，例如：
     * - GET /api/v1/notices/{id} -> getNoticeById
     * - DELETE /api/v1/notices/batch -> deleteNoticeBatch
     *
     * 目的：
     * 1. 从源头消灭 create_1 / list_4 这类生成器冲突后缀
     * 2. 让 OpenAPI / orval / 其他代码生成器都看到稳定且唯一的名字
     */
    @Bean
    public GlobalOpenApiCustomizer stableOperationIdCustomizer() {
        return openApi -> {
            Paths paths = openApi.getPaths();
            if (paths == null) {
                return;
            }

            paths.forEach((path, pathItem) -> pathItem.readOperationsMap().forEach((method, operation) ->
                    operation.setOperationId(buildOperationId(method, path))));
        };
    }

    private static String buildOperationId(PathItem.HttpMethod method, String rawPath) {
        String normalizedPath = rawPath.replaceFirst("^/api/v\\d+/?", "");
        if (normalizedPath.isBlank()) {
            return method.name().toLowerCase(Locale.ROOT) + "Root";
        }

        List<String> tokens = new ArrayList<>();
        tokens.add(method.name().toLowerCase(Locale.ROOT));

        for (String segment : normalizedPath.split("/")) {
            if (segment.isBlank()) {
                continue;
            }

            if (segment.startsWith("{") && segment.endsWith("}")) {
                tokens.add("By");
                tokens.add(toPascalCase(segment.substring(1, segment.length() - 1)));
                continue;
            }

            tokens.add(toPascalCase(singularize(segment)));
        }

        return lowerCamel(tokens);
    }

    private static String lowerCamel(List<String> tokens) {
        if (tokens.isEmpty()) {
            return "unknownOperation";
        }

        StringBuilder builder = new StringBuilder(tokens.get(0));
        for (int i = 1; i < tokens.size(); i++) {
            builder.append(tokens.get(i));
        }
        return builder.toString();
    }

    private static String toPascalCase(String value) {
        String[] parts = value.split("[-_]");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            String lower = part.toLowerCase(Locale.ROOT);
            builder.append(Character.toUpperCase(lower.charAt(0)));
            if (lower.length() > 1) {
                builder.append(lower.substring(1));
            }
        }
        return builder.toString();
    }

    private static String singularize(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.endsWith("ies") && lower.length() > 3) {
            return lower.substring(0, lower.length() - 3) + "y";
        }
        if (lower.endsWith("ses") && lower.length() > 3) {
            return lower.substring(0, lower.length() - 2);
        }
        if (lower.endsWith("s") && lower.length() > 1 && !lower.endsWith("ss")) {
            return lower.substring(0, lower.length() - 1);
        }
        return lower;
    }
}
