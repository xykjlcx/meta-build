package com.metabuild.infra.jooq;

import com.metabuild.common.exception.BusinessException;
import org.jooq.Field;
import org.jooq.SortField;
import org.jooq.Table;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 排序参数解析工具：基于白名单的安全排序字段解析。
 *
 * <p>使用示例：
 * <pre>{@code
 * List<SortField<?>> sorts = SortParser.builder()
 *     .forTable(MB_IAM_USER)
 *     .allow("username", MB_IAM_USER.USERNAME)
 *     .defaultSort(MB_IAM_USER.CREATED_AT.desc())
 *     .parse(sortParams);
 * }</pre>
 *
 * <p>排序参数格式：{@code "fieldName,asc"} 或 {@code "fieldName,desc"}，
 * 未知字段抛出 BusinessException。
 */
public class SortParser {

    private SortParser() {
        // 工具类，通过 Builder 使用
    }

    /**
     * 创建 Builder。
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private final Map<String, Field<?>> allowedFields = new LinkedHashMap<>();
        private SortField<?> defaultSort;

        /**
         * 自动注册表的 id / created_at / updated_at 字段（存在时）。
         *
         * @param table jOOQ 表对象
         * @return this
         */
        public Builder forTable(Table<?> table) {
            registerIfExists(table, "id");
            registerIfExists(table, "created_at");
            registerIfExists(table, "updated_at");
            return this;
        }

        /**
         * 显式允许某个排序字段。
         *
         * @param apiName API 参数中使用的字段名（如 "username"）
         * @param field   对应的 jOOQ Field
         * @return this
         */
        public Builder allow(String apiName, Field<?> field) {
            allowedFields.put(apiName.toLowerCase(), field);
            return this;
        }

        /**
         * 设置默认排序（无参数时使用）。
         *
         * @param sort 默认排序字段
         * @return this
         */
        public Builder defaultSort(SortField<?> sort) {
            this.defaultSort = sort;
            return this;
        }

        /**
         * 解析排序参数列表。
         *
         * @param sortParams 排序参数，格式为 "fieldName,asc" 或 "fieldName,desc"
         * @return jOOQ SortField 列表
         * @throws BusinessException 包含不在白名单内的字段时抛出
         */
        public List<SortField<?>> parse(List<String> sortParams) {
            if (sortParams == null || sortParams.isEmpty()) {
                return defaultSort != null ? List.of(defaultSort) : List.of();
            }

            List<SortField<?>> result = new ArrayList<>(sortParams.size());
            for (String param : sortParams) {
                if (param == null || param.isBlank()) {
                    continue;
                }
                result.add(parseSingle(param.trim()));
            }
            return result.isEmpty() && defaultSort != null ? List.of(defaultSort) : result;
        }

        /**
         * 解析单个排序参数，格式：{@code "fieldName,asc"} 或 {@code "fieldName,desc"}。
         * 未指定方向时默认升序。
         */
        private SortField<?> parseSingle(String param) {
            String fieldName;
            boolean ascending;

            int commaIndex = param.lastIndexOf(',');
            if (commaIndex > 0) {
                fieldName = param.substring(0, commaIndex).trim();
                String direction = param.substring(commaIndex + 1).trim().toLowerCase();
                ascending = !"desc".equals(direction);
            } else {
                fieldName = param;
                ascending = true;
            }

            Field<?> field = allowedFields.get(fieldName.toLowerCase());
            if (field == null) {
                // 也尝试 camelCase → snake_case 反向查找
                String snakeCase = toSnakeCase(fieldName);
                field = allowedFields.get(snakeCase.toLowerCase());
            }

            if (field == null) {
                throw new BusinessException("common.pagination.invalidSortField", fieldName);
            }

            return ascending ? field.asc() : field.desc();
        }

        /**
         * 注册表中存在的字段，同时支持 camelCase 和下划线两种访问名。
         */
        private void registerIfExists(Table<?> table, String columnName) {
            Field<?> field = table.field(columnName);
            if (field != null) {
                // 下划线格式：created_at → createdat（去掉下划线，全小写）
                allowedFields.put(columnName.replace("_", "").toLowerCase(), field);
                // camelCase 格式：created_at → createdAt
                allowedFields.put(toCamelCase(columnName), field);
                // 原始格式：created_at
                allowedFields.put(columnName.toLowerCase(), field);
            }
        }

        /**
         * snake_case 转 camelCase（如 created_at → createdAt）。
         */
        private static String toCamelCase(String snakeCase) {
            StringBuilder sb = new StringBuilder();
            boolean nextUpper = false;
            for (char c : snakeCase.toCharArray()) {
                if (c == '_') {
                    nextUpper = true;
                } else if (nextUpper) {
                    sb.append(Character.toUpperCase(c));
                    nextUpper = false;
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        /**
         * camelCase 转 snake_case（如 createdAt → created_at）。
         */
        private static String toSnakeCase(String camelCase) {
            StringBuilder sb = new StringBuilder();
            for (char c : camelCase.toCharArray()) {
                if (Character.isUpperCase(c)) {
                    sb.append('_').append(Character.toLowerCase(c));
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }
    }
}
