# ADR-0015：分页契约拆分为请求 DTO 与内部 Query

## 状态

已采纳

## 日期

2026-04-15

## 背景

M5 之后开始补平台模块前端页面时，发现分页列表接口的 OpenAPI / orval 契约生成存在结构性问题：

- 后端运行时原本通过 `PageQueryArgumentResolver` 把 HTTP query string 解析为 `PageQuery`
- springdoc 生成 OpenAPI 时不会执行自定义 `HandlerMethodArgumentResolver`
- 结果列表接口的分页参数被生成为单个 `query` 对象，而不是扁平的 `page` / `size` / `sort`
- orval 的 fetch client 默认按 `Object.entries + value.toString()` 序列化 query 参数，最终生成 `?query=[object Object]`

为了修复契约链路，临时把若干 controller 改成了显式 `@RequestParam page/size/sort`。这让 OpenAPI 与前端 SDK 立即恢复正确，但同时绕过了原本集中在 `PageQueryArgumentResolver` 里的统一分页保护：

- `mb.api.pagination.default-size`
- `mb.api.pagination.max-size`
- `page` / `size` 的非法值处理

问题本质不是 `record` 与 `DTO` 的语法差异，而是一个对象同时承担了两种职责：

1. **HTTP 边界输入对象**：表示“用户传了什么”
2. **内部可信分页对象**：表示“系统已经归一化并认可的分页语义”

这两种职责混在一个类型上，会让 Spring MVC、springdoc、OpenAPI、orval 四层机制的语义边界失真。

## 决策

分页契约改为三段式：

1. **`PageRequestDto`**：HTTP 边界输入对象  
   放在 `infra-web.pagination`，用于 Spring MVC 绑定与 springdoc `@ParameterObject` 展开。允许 `page` / `size` 为 `null`，仅表达原始输入。

2. **`PaginationPolicy` + `MbPaginationProperties`**：统一分页归一化策略与配置  
   放在 `infra-web.pagination`，由 `infra-web` 模块自动配置统一注册，是唯一合法的分页归一化入口，负责：
   - `page` 默认值：1
   - `size` 默认值：`mb.api.pagination.default-size`
   - `size` 上限：`mb.api.pagination.max-size`
   - 空白 `sort` 清洗
   - 非法值直接抛 `BusinessException(400)`

3. **`PageQuery`**：内部可信分页对象  
   继续放在 `mb-common.dto`，不再承载 HTTP 绑定职责，只表示“归一化后的分页语义”。

### 非法值策略

- `page == null`：默认 1
- `size == null`：默认 `mb.api.pagination.default-size`
- `page < 1`：HTTP 400
- `size < 1` 或 `size > max-size`：HTTP 400

不再做静默 clamp。分页参数属于调用契约，错误请求应显式失败。

### 控制器写法

平台模块 controller 统一采用：

```java
public PageResult<UserVo> list(@ParameterObject PageRequestDto request) {
    return userService.list(paginationPolicy.normalize(request));
}
```

### 架构守护

新增 ArchUnit 规则：

1. 生产代码中，只有 `PaginationPolicy` 允许调用 `PageQuery.normalized(...)`
2. `PageRequestDto` 不允许泄漏到 `..web..` 之外

## 结果

### 正面结果

- Spring MVC / springdoc / OpenAPI / orval 语义链路对齐
- 前端 SDK 继续得到扁平 query 参数：`page` / `size` / `sort`
- 统一分页保护恢复为单入口，不再散落在 controller
- `PageQuery` 的语义重新收敛为“内部可信对象”
- 模块职责清晰：`infra-web` 承载共享分页 Web 边界能力，`infra-exception` 回归异常处理本职

### 代价

- controller 不再是“零样板直接接 `PageQuery`”
- 新增 `PageRequestDto` / `PaginationPolicy`，并把分页配置归一到 `MbPaginationProperties`
- 废弃 `PageQueryArgumentResolver` 与 `WebMvcConfig`

## 为什么不选其他方案

### 方案 A：继续显式 `@RequestParam`

优点是快，但统一分页规则会散落到每个 controller，长期一定 drift。

### 方案 B：继续用 `PageQuery + resolver`

运行时可行，但 springdoc 不理解自定义 resolver 的语义，OpenAPI/orval 链路已经证明会失真。

### 方案 D：直接把 `PageQuery` 改成 Web DTO

技术上可行，但会让同一个类型同时表示“原始输入”和“内部可信对象”，职责继续混淆。
