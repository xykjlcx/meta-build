package com.metabuild.infra.jooq;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 数据权限注册表：记录哪些表需要数据权限过滤，以及用哪个字段做部门隔离。
 * 业务模块启动时调用 register() 声明需要过滤的表，DataScopeVisitListener 在构建 SQL 时读取。
 */
public class DataScopeRegistry {

    private final Map<String, String> tableColumnMap = new ConcurrentHashMap<>();

    /**
     * 注册需要数据权限过滤的表。
     *
     * @param tableName     表名（大小写不敏感）
     * @param deptColumnName 用于过滤的部门 ID 字段名
     */
    public void register(String tableName, String deptColumnName) {
        tableColumnMap.put(tableName.toLowerCase(), deptColumnName);
    }

    /**
     * 获取表对应的部门列名。
     *
     * @param tableName 表名
     * @return 部门列名，未注册时返回 empty
     */
    public Optional<String> getDeptColumn(String tableName) {
        return Optional.ofNullable(tableColumnMap.get(tableName.toLowerCase()));
    }

    /**
     * 判断表是否已注册数据权限。
     *
     * @param tableName 表名
     * @return 已注册返回 true
     */
    public boolean isRegistered(String tableName) {
        return tableColumnMap.containsKey(tableName.toLowerCase());
    }

    /**
     * 获取所有已注册的表名集合。
     *
     * @return 已注册表名的不可变集合
     */
    public Set<String> getRegisteredTables() {
        return Collections.unmodifiableSet(tableColumnMap.keySet());
    }
}
