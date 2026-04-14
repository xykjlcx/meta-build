# ADR-0013: platform-oplog 改名 platform-log + @OperationLog 注解下沉 mb-common

## 状态
已采纳

## 背景
M1-M4 审查发现 `@OperationLog` 注解定义在 `platform-oplog` 内部，其他 platform 模块无法使用（会产生横向依赖）。
同时 "oplog" 命名过窄，未来审计日志、登录日志等也应归入同一模块。

## 决策
1. `platform-oplog` 重命名为 `platform-log`
2. `@OperationLog` 注解下沉到 `mb-common` 的 `com.metabuild.common.log` 包
3. 数据库表 `mb_operation_log` 重命名为 `mb_log_operation`（符合 `mb_<module>_<table>` 规范）

## 后果
- 任何 platform/business 模块都可以使用 `@OperationLog`
- 日志相关的新功能统一归入 `platform-log`
