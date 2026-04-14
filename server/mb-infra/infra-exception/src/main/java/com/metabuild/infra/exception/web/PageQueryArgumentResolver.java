package com.metabuild.infra.exception.web;

import com.metabuild.common.dto.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Arrays;
import java.util.List;

/**
 * 自动解析 PageQuery 参数：page（默认1）、size（默认20，最大200）、sort（多值列表）。
 * <p>
 * 示例请求：GET /api/users?page=2&size=10&sort=createdAt,desc&sort=name,asc
 */
@RequiredArgsConstructor
public class PageQueryArgumentResolver implements HandlerMethodArgumentResolver {

    private final MbPaginationProperties props;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return PageQuery.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public PageQuery resolveArgument(MethodParameter parameter,
                                     ModelAndViewContainer mavContainer,
                                     NativeWebRequest webRequest,
                                     WebDataBinderFactory binderFactory) {
        int page = parseIntOrDefault(webRequest.getParameter("page"), 1);
        int size = parseIntOrDefault(webRequest.getParameter("size"), props.defaultSize());
        String[] sortParams = webRequest.getParameterValues("sort");

        // 校验范围
        if (page < 1) page = 1;
        if (size < 1) size = props.defaultSize();
        if (size > props.maxSize()) size = props.maxSize();

        // 解析 sort 列表（支持多值 &sort=createdAt,desc&sort=name）
        List<String> sort = null;
        if (sortParams != null && sortParams.length > 0) {
            sort = Arrays.stream(sortParams)
                .filter(s -> s != null && !s.isBlank())
                .toList();
            if (sort.isEmpty()) sort = null;
        }

        return new PageQuery(page, size, sort);
    }

    private int parseIntOrDefault(String value, int defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
