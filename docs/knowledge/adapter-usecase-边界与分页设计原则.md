# Adapter / UseCase 边界与分页设计原则

> 形成时间：2026-04-15
>
> 这不是 ADR，也不是某个 milestone 的交接文档，而是一份从多轮架构讨论中提炼出来的**工作原则**。目标是统一后续设计判断，避免继续靠局部补丁推进。

---

## 1. 核心判断

### 1.1 Controller 的本质

Controller 不应被理解成“写 HTTP 接口的地方”，而应被理解成：

> **边界适配层（Adapter / Media）**

它的职责是把外部世界的协议、端差异、表达方式翻译成系统内部稳定的调用方式。

它适配的对象包括但不限于：

- HTTP path / query / body
- header / cookie / token
- WebSocket / SSE event
- MQTT topic / payload
- 第三方 webhook 回调
- Web 管理端 / 小程序 / App / 嵌入式硬件等不同交付端

### 1.2 Service 的本质

Service 不应被理解成“带 `@Service` 注解的类”，而应被理解成：

> **稳定业务能力层**

它应该尽量与协议无关、与端无关、与传输格式无关。它关心的是：

- 业务规则
- 状态机
- 权限边界
- 核心能力
- 跨仓储的数据一致性

### 1.3 为什么要分层

分层的目的不是“层数多看起来专业”，而是：

> **把不同变化源隔离开**

系统里至少有三类变化源：

1. 外部交互方式会变：HTTP / WebSocket / MQTT / 定时任务 / 消息队列
2. 业务规则变化相对慢：发布、撤回、启用、审核等规则
3. 数据与存储变化更慢：表结构、索引、查询策略

所以，越靠近外部协议的层越容易变，越靠近业务能力和数据语义的层越稳定。

---

## 2. 模块内能力与 Admin 端能力的边界

### 2.1 模块内保留原子能力

一个模块自身应保留“它天然拥有的原子能力接口”，例如：

- CRUD
- 启用 / 禁用
- 发布 / 撤回
- 重置密码
- 绑定 / 解绑
- 详情查询
- 列表查询

判断标准：

1. 单模块就能闭环
2. 不依赖某个端的特定表达方式
3. 本质上是该模块天然能力
4. 未来多个端都可能复用

这些能力应放在模块自身的 `web` + `domain` 中，而不是上提到 Admin。

### 2.2 Admin 只承接管理端特有流程

`mb-admin` 不应成为“第二套领域层”，它只承接：

- Web 管理端特有流程
- 需要协调多个模块的用例
- 管理端专属聚合视图
- 管理端专属的流程编排接口

也就是说，Admin 承担的是：

> **管理端交付层 + 管理端用例编排层**

不承担原子业务规则的归属。

### 2.3 Admin 里的这一层命名为 `usecase`

在 `mb-admin` 内部，承接管理端特有流程的这一层，命名用：

> **`usecase`**

不用 `business`，原因：

- 项目里已经有顶层 `mb-business`
- `business` 容易和业务模块层语义冲突
- `usecase` 更准确表达“面向交付端的流程编排”

建议结构：

```text
mb-platform/platform-xxx/
  api/
  domain/
  web/

mb-admin/
  web/
  usecase/
```

### 2.4 Admin 的硬约束

Admin 中的 `usecase` 层只做编排，不拥有原子规则。

也就是：

- 能力定义在各模块
- Admin 只组合
- Admin 不重新发明“发布公告”“禁用用户”“分配角色”这类原子规则

否则 Admin 会长成一个巨大的万能业务层，边界会再次坍塌。

---

## 3. 分页契约的本质

### 3.1 问题不是 record vs DTO

分页问题的本质不是 Java 语法，而是**职责混淆**：

同一个对象不应该同时表达：

1. **HTTP 原始输入**
2. **系统归一化后的可信分页语义**

如果一个对象同时承担这两个职责，就会在 Spring MVC、springdoc、OpenAPI、orval 之间产生语义错位。

### 3.2 三段式分页契约

分页契约统一采用三段式：

1. `PageRequestDto`  
   HTTP 边界输入对象，只表达 query string 原始输入

2. `PaginationPolicy`  
   唯一合法的分页归一化入口，负责默认值、上限、非法值处理

3. `PageQuery`  
   内部可信分页对象，只表示归一化后的分页语义

模块归属：

- `infra-web.pagination`：`PageRequestDto` / `PaginationPolicy` / `MbPaginationProperties`
- `mb-common.dto`：`PageQuery` / `PageResult`

对应链路：

```text
HTTP query
  -> PageRequestDto
  -> PaginationPolicy.normalize()
  -> PageQuery
  -> Service / Repository
```

### 3.3 分页统一规则

分页统一规则属于共享规则，不允许散落到各个 controller 手写。

统一规则：

- `page == null` -> 默认 1
- `size == null` -> 默认 `mb.api.pagination.default-size`
- `page < 1` -> 400
- `size < 1 || size > max-size` -> 400
- 空白 `sort` 项清洗后丢弃

### 3.4 统一性的定义

“统一分页处理仍然生效”的真正含义不是“还有 resolver”，而是：

> **系统里仍然存在且只存在一个分页归一化入口**

这个入口现在不是 `PageQueryArgumentResolver`，而是 `PaginationPolicy`。

---

## 4. 请求 DTO、业务 Query、PageQuery 的关系

### 4.1 硬规则：分页必须独立成 `PageQuery`

分页是横切关注点，值得统一，因此：

> **`PageQuery` 必须独立**

### 4.2 软规则：业务筛选对象按复杂度决定

不要强制每个列表都单独定义一个 `Filter` / `Query` 类型。

判断标准如下：

#### 简单查询

如果只有少量筛选项，例如：

- `keyword`
- `status`

则 Service 层可以直接收显式参数，例如：

```java
PageResult<UserView> list(String keyword, Integer status, PageQuery page)
```

不必为了形式统一而制造无复用的小类型。

#### 复杂查询

如果筛选项达到中等复杂度，例如：

- 3 个以上筛选字段
- 存在时间范围
- 多处复用
- Repository / Export / 统计都要共享

则可以定义业务 Query 类型，例如：

```java
public record NoticeQuery(
    Short status,
    String keyword,
    OffsetDateTime startTimeFrom,
    OffsetDateTime startTimeTo
) {}
```

然后 Service 层拿：

```java
PageResult<NoticeView> list(NoticeQuery query, PageQuery page)
```

### 4.3 推荐模式

推荐使用：

- Controller 层：业务请求 DTO 继承 `PageRequestDto`
- Service 层：拿 `query/filter + PageQuery`

例如：

```java
public class NoticeListRequestDto extends PageRequestDto {
    private Short status;
    private String keyword;
    private OffsetDateTime startTimeFrom;
    private OffsetDateTime startTimeTo;
}
```

```java
public PageResult<NoticeView> list(@ParameterObject NoticeListRequestDto request) {
    NoticeQuery query = new NoticeQuery(
        request.getStatus(),
        request.getKeyword(),
        request.getStartTimeFrom(),
        request.getStartTimeTo()
    );
    PageQuery page = paginationPolicy.normalize(request);
    return noticeService.list(query, page);
}
```

这套模式的价值在于：

- 分页问题真正统一
- 业务筛选对象按需引入，不制造类膨胀
- Controller 不直接把 HTTP DTO 下沉到 Service

---

## 5. 设计判断清单

以后遇到一个列表接口，按这个顺序判断：

### 第一步：分页是否独立？

如果分页没有独立成 `PageQuery`，先拆。

### 第二步：业务筛选是否复杂？

- 简单：Service 直接显式参数
- 复杂：抽 `Query` / `Filter`

### 第三步：这个接口是模块原子能力，还是某个端特有流程？

- 原子能力：放模块内
- 管理端特有聚合流程：放 `mb-admin/usecase`

### 第四步：Controller 是否只做适配？

如果 Controller 开始承载真正的业务规则，说明边界又脏了。

---

## 6. 当前已经落地的原则

截至 2026-04-15，以下原则已经落地：

1. 分页契约已采用 `PageRequestDto + PaginationPolicy + PageQuery`
2. `PageQuery` 只表示内部可信分页语义
3. 只有 `PaginationPolicy` 允许创建 `PageQuery`
4. `PageRequestDto` 不允许泄漏出 `..web..`
5. `business-notice` 已对齐为“业务 Query + 独立分页”的模式

---

## 7. 一句话总结

> **模块内保留可复用的原子能力接口；Admin 只承接管理端特有的聚合流程与编排接口。**
>
> **分页必须统一成独立的内部语义对象；业务筛选对象按复杂度决定是否单独建类。**
