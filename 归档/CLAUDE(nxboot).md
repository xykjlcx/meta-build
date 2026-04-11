# NxBoot 全栈脚手架

> AI 友好型后台管理系统脚手架。本文件是 AI 的操作手册——读完即可按规范写代码。

---

## 架构概览

单仓库，后端四模块（common → framework → system → admin），前端 Feature-based 目录。系统领域按 DDD 风格垂直切片，每个领域自包含 model/controller/service/repository。前后端领域一一对称。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | JDK 21 + Spring Boot 3.4 + jOOQ + PostgreSQL + Flyway + Redis + JWT (JJWT) + SpringDoc |
| 前端 | Vite + React 18 + TypeScript strict + Ant Design 6 + TanStack Query + Zustand + react-i18next |
| 样式 | CSS Modules + CSS 变量（`tokens.css`） |
| 测试 | 后端 JUnit 5 + Testcontainers + JaCoCo；前端 Vitest + React Testing Library + MSW |
| 规范 | Biome (lint + format)，pnpm |

## 项目结构

```
nxboot/
├── server/                          ← 后端
│   ├── nxboot-common/               ← 纯工具层（零 Spring 依赖）
│   ├── nxboot-framework/            ← 框架配置（Security/jOOQ/Web）
│   ├── nxboot-system/               ← 系统领域（DDD 垂直切片）
│   └── nxboot-admin/                ← 启动模块（Application + Flyway + 配置）
└── client/                          ← 前端
    └── src/
        ├── app/                     ← 应用壳（路由/布局/请求/权限守卫）
        │   ├── layouts/             ← BasicLayout（三级导航）+ BlankLayout
        │   ├── routes.tsx           ← 路由配置
        │   ├── request.ts           ← Axios 封装
        │   ├── auth-guard.tsx       ← 登录守卫
        │   └── Placeholder.tsx      ← 占位页面
        ├── features/system/         ← 业务模块（与后端领域 1:1 对应）
        ├── shared/                  ← 共享组件（NxTable/NxBar/NxDrawer/NxFilter/NxLoading）和 hooks
        └── types/                   ← 全局类型（R<T>/PageResult/PageQuery）
```

## 前端布局架构（三级导航）

```
子系统（九宫格切换）→ 模块（Header Tab）→ 页面（左侧 Sider 菜单）
```

- **九宫格切换**：左上角 AppstoreOutlined 图标，Popover 弹出子系统卡片
- **Header Tab**：圆角矩形 pill 按钮，蓝底白字表示当前模块
- **Sider 菜单**：白底、贴边、选中项浅蓝底 + 左侧蓝色指示条、底部折叠按钮
- **面包屑**：内容区顶部，自动根据三级导航配置生成

子系统/模块/菜单配置在 `BasicLayout.tsx` 的 `subsystems` 数组中。新增子系统或模块只需修改这个配置 + 添加对应路由。

## 共享组件

| 组件 | 路径 | 职责 |
|------|------|------|
| NxTable | `shared/components/NxTable/` | 表格抽象层，自有 `NxColumn<T>` 类型，屏蔽底层引擎（当前 Ant Design Table，后续可切 AG Grid） |
| NxBar | `shared/components/NxBar/` | 操作栏容器，`left`/`right` 插槽统一工具栏布局 |
| NxDrawer | `shared/components/NxDrawer/` | 抽屉组件（compound pattern: Root/Trigger/Content/useContext），支持全屏切换、骨架屏 loading |
| NxFilter | `shared/components/NxFilter/` | 搜索栏，延迟搜索 + 筛选计数 badge |
| NxLoading | `shared/components/NxLoading/` | 统一加载指示器，Suspense fallback 标准组件 |
| NxForm | `shared/components/NxForm/` | Schema-Driven 表单，10 种组件类型，动态显隐，栅格布局 |
| ApiSelect | `shared/components/ApiSelect/` | 远程数据源 Select，带 loading、搜索、内存缓存 |

### NxTable 关键约定
- 列定义用 `NxColumn<T>`（`field` 而非 `dataIndex`），操作列 `field: "_action"`
- 默认 `size="small"`（紧凑行高），默认 `rowKey="id"`
- 分页内置 showSizeChanger/showQuickJumper/showTotal，页面只需传 current/pageSize/total/onChange
- 空数据自动显示"暂无数据"

### 共享 Hooks

| Hook | 路径 | 职责 |
|------|------|------|
| useAuth | `shared/hooks/useAuth.ts` | Zustand 认证状态（token/user/login/logout） |
| usePerm | `shared/hooks/usePerm.ts` | 权限判断 `has("system:user:create")` |
| useDict | `shared/hooks/useDict.ts` | 字典数据查询（5 分钟缓存），提供 `labelOf()`、`options` |
| useTheme | `shared/hooks/useTheme.ts` | 主题切换（light/dark），持久化 localStorage |
| useGuardedSubmit | `shared/hooks/useRequest.ts` | 防重复提交，返回 `[execute, loading]` |

### 共享工具

| 工具 | 路径 | 职责 |
|------|------|------|
| downloadBlob | `shared/utils/download.ts` | Blob 文件下载 |

### Preferences 偏好系统

- `shared/stores/preferences.ts` — Zustand + persist 持久化到 localStorage
- 3 种布局模式：`mix`（混合导航，默认）、`sidebar`（经典左侧）、`top`（顶部水平菜单）
- 可配置项：sidebarWidth、headerHeight、colorPrimary（联动 Ant Design）、headerBgColor、showBreadcrumb、contentBorderRadius
- `usePreferences()` hook 读写配置

### Token 刷新

- 后端签发 access token（24h）+ refresh token（7d）
- 前端 401 时自动用 refresh token 刷新，并发请求排队等待新 token
- 刷新失败才跳登录页

### 动态菜单

- `GET /api/v1/auth/menus` 返回当前用户基于角色权限过滤的菜单树
- admin 角色返回所有 M/C 类型菜单，非 admin 按 role_menu 过滤
- 前端 `menusToSubsystems()` 将后端菜单树转为三级导航配置
- 图标字段存 Ant Design 图标名（如 `UserOutlined`），前端自动映射

### 暗色模式（TokenBridge 架构）

- **TokenBridge** 组件将 Ant Design 主题令牌自动同步到 CSS 自定义属性
- tokens.css 中不需要手动维护暗色值——antd darkAlgorithm 统一派生
- `useTheme()` hook 管理切换，Header 用户下拉菜单有切换入口
- `<App>` 组件包裹确保 message/modal/notification 继承主题
- 支持系统偏好自动检测

### 数据权限（@DataScope）

- `@DataScope` 注解标注在 Service 查询方法上
- AOP 切面根据当前用户角色的 `data_scope` 构建 jOOQ Condition，通过 ThreadLocal 传递
- Repository 调用 `JooqHelper.dataScopeCondition()` 获取并拼接条件
- 5 种粒度全部实现：1=全部、2=自定义部门、3=本部门、4=本部门及下级、5=仅本人
- Scope 2（自定义部门）通过角色表单的 `dataScope + deptIds` 配置，存 `sys_role_dept` 关联表
- 空关联时显式返回 `falseCondition`（防止全查），并记录日志
- admin 角色（`*:*:*`）自动跳过数据权限
- 性能索引：`sys_user.dept_id` + `sys_role_dept.dept_id`（V27 迁移）

### 操作日志

- 后端 Controller 写操作加 `@Log(module = "xxx", operation = "xxx")` 注解
- `AccessLogInterceptor` 自动拦截、记录请求信息并写入 sys_operation_log 表
- 日志记录包含：模块、操作、请求 URL/方法/参数、操作人、IP、耗时、异常信息

### jOOQ 工具（JooqHelper）

- `JooqHelper.page()` — 通用分页查询（自动加 deleted=0 + 按 create_time 排序）
- `JooqHelper.findById()` — 按 ID 查询（自动加 deleted=0）
- `JooqHelper.softDelete()` — 逻辑删除（自动填充 update_by/update_time）
- `JooqHelper.keywordCondition()` — 多字段关键词模糊搜索条件构建
- `JooqHelper.notDeleted()` — 未删除条件
- `JooqHelper.setAuditInsert()` — INSERT 审计字段一行填充（id + create/update + deleted）
- `JooqHelper.setAuditUpdate()` — UPDATE 审计字段一行填充（update_by + update_time）
- `JooqHelper.optimisticUpdate()` — 乐观锁更新（version 不匹配抛异常）
- `JooqHelper.dataScopeCondition()` — 读取 @DataScope AOP 注入的数据权限条件

### 在线用户管理

- `TokenBlacklist` — 内存版 JWT 黑名单（ConcurrentHashMap），强制下线后 token 立即失效
- `OnlineUserService` — 在线用户追踪（登录注册、列表查询、强制下线）
- `JwtAuthenticationFilter` 每次请求检查黑名单
- 前端 `/system/online` 页面，30s 自动刷新

### 服务器监控

- `GET /api/v1/system/monitor/server` — OSHI 库获取 CPU/内存/磁盘/JVM 信息
- 权限：`system:monitor:list`

### 定时任务执行历史

- `sys_job_log` 表记录每次任务执行的开始/结束/耗时/状态/异常
- 前端 `/system/job-log` 页面，支持按任务和状态筛选

### 慢查询日志

- `SlowQueryListener` 注册在 jOOQ 配置中，记录 >500ms 的 SQL
- 开发环境 `org.jooq.tools.LoggerListener: DEBUG` 输出全部 SQL

### 文件存储（FileStorage 接口）

- `FileStorage` 接口屏蔽存储后端差异（本地/OSS/S3）
- 当前实现：`LocalFileStorage`（本地磁盘）
- 切换配置：`nxboot.file.storage-type=local|oss`
- 扩展 OSS：引入 SDK + 实现 `OssFileStorage` + 在 `FileStorageConfig` 注册

### 缓存策略（Redis + @Cacheable）

- 已缓存读路径：`MenuService.getUserMenuTree`、`UserDetailsServiceImpl`、`DictService`、`ConfigService`
- 缓存 Key 约定：`system.menu.user`、`system.user.details`、`system.dict.type`、`system.config.key` 等
- 写路径必须走 `CacheEvictSupport.evictAfterCommit(...)` 或 `@CacheEvict`，**禁止裸调 `cache.evict()`**——前者保证事务提交后再失效，避免脏读
- 级联失效：菜单/角色变更 → 同时失效 `system:user:details` + `system:menu:user`（权限同步生效）
- `CachingEnabledConfig` 独立于 `CacheConfig`，测试切面可按需关闭

### WebSocket + 通知公告

- 握手端点：`/ws`，使用一次性 ticket 认证（`GET /api/v1/auth/ws-ticket` 换取）——不把 JWT 放 query string
- 前端：`shared/websocket/client.ts`（单例 wsClient）+ `useWebSocket` hook，自动重连
- 后端：`NotificationWebSocketHandler.pushToUser(userId, msg)` / `broadcast(msg)`，用 `ConcurrentWebSocketSessionDecorator` 防慢客户端阻塞事件循环
- `notice` 领域：草稿 → 发布 → 全站广播，发布时调用 broadcast，前端 Header 铃铛实时收通知
- 强制下线联动：`OnlineUserService.forceLogout` 会主动关闭目标用户的 WebSocket 连接
- 握手阶段检查 JWT 黑名单，防止已下线 token 建连

### 数据变更审计（sys_audit_log）

- `AuditHelper` 提供 `logCreate/logUpdate/logDelete`，自动 diff 新旧字段，只记变化项
- 已接入：`ConfigService`、`UserService`、`RoleService`、`MenuService`、`DeptService`
- Entity type 命名：`sys_user`、`sys_role`、`sys_menu`、`sys_dept`、`sys_config`，密码单独走 `sys_user_password`（值脱敏）
- 密码等敏感字段通过脱敏列表过滤，不落库
- List/Collection 字段顺序无关比较（Set diff），避免排序抖动被误判为变更
- 前端 `/system/audit` 页面：列表 + 变更 diff 详情

### 国际化 (i18n)

- 后端：`messages_zh_CN.properties` / `messages_en_US.properties`，放在 `nxboot-admin/src/main/resources/i18n/`
- 前端：`react-i18next`，locale 文件在 `shared/i18n/locales/{zh-CN,en-US}.ts`，按命名空间组织
- `useTranslation()` hook 读取翻译，`columns.tsx` 改为工厂函数 `buildXxxColumns(t)` 接收 `TFunction`
- Header 用户下拉菜单包含语言切换入口
- Ant Design locale 通过 `ConfigProvider` 联动（zh-CN → `zhCN`，en-US → `enUS`）
- 业务页面已全量 i18n，**菜单名称仍来自 DB**（需后续菜单 i18n 机制）

### 测试体系

- **后端**：JUnit 5 + Testcontainers（PostgreSQL 单例容器 + `@DynamicPropertySource`）+ JaCoCo 聚合覆盖率
  - `BaseIntegrationTest` — 共享容器 + Spring Boot 测试上下文
  - `TestHelper` — 测试数据构建工具（用户、角色、菜单等）
  - 命名规范：`XxxIntegrationTest.java`（后端）
  - 运行：`cd server && mvn verify`
  - 覆盖率报告：`server/target/site/jacoco-aggregate/index.html`
- **前端**：Vitest + React Testing Library + MSW
  - 命名规范：`xxx.test.tsx` / `xxx.test.ts`
  - 运行：`cd client && pnpm test`
  - 覆盖率报告：`client/coverage/index.html`
- **CI**：GitHub Actions 集成测试执行 + 覆盖率上传

### 定时任务执行引擎

- `DemoJobHandler` 为参考实现，新任务按其模板写
- `invoke_target` 格式：`beanName.methodName`（例 `demoJobHandler.sayHello`）
- 目标方法必须加 `@JobHandler` 注解，否则拒绝执行（白名单机制）
- Scheduler 操作（注册/删除/触发）全部走 `TransactionSynchronizationManager.afterCommit`，避免事务回滚后 Quartz 状态漂移

### OpenAPI / Swagger

- 全部 15 个 Controller 加 `@Tag` + `@Operation` 注解，UI 中按领域分组
- 集成 JWT Bearer Auth：Swagger UI 顶部"Authorize"按钮输入 token 后即可联调
- 访问入口：`/swagger-ui.html`
- 配置见 `OpenApiConfig`

## 模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| nxboot-common | 工具类、常量、异常、R\<T\>、PageQuery/PageResult、SnowflakeId | 无（零 Spring 依赖） |
| nxboot-framework | Security/JWT、jOOQ/JooqHelper、Cache（Redis + CacheEvictSupport）、WebSocket（Handler/Interceptor/TicketService）、CORS、限流、XSS 过滤、MDC 追踪、@Async 线程池、FileStorage、i18n | common |
| nxboot-system | 13 个领域包：auth/user/role/menu/dept/dict/config/log/file/job/monitor/notice/audit + online 子模块 | framework |
| nxboot-admin | NxBootApplication 启动类 + Flyway 迁移脚本 + 多环境配置 + i18n messages | system |

依赖方向：**admin → system → framework → common**（单向，禁止反向依赖）

---

## 新增 CRUD 模块的标准流程

> 这是最重要的部分。新增一个业务模块（如"公告管理"）需要以下步骤：

### 后端（5 个文件 + 1 个 SQL）

在 `server/nxboot-system/src/main/java/com/nxboot/system/` 下新建领域包：

```
notice/
├── model/
│   ├── NoticeVO.java            ← JDK Record，查询返回
│   └── NoticeCommand.java       ← 嵌套 Record（Create / Update），含 JSR-303 校验
├── controller/
│   └── NoticeController.java    ← REST 接口 + @PreAuthorize 权限控制
├── service/
│   └── NoticeService.java       ← 业务逻辑 + @Transactional
└── repository/
    └── NoticeRepository.java    ← jOOQ 数据访问
```

在 `server/nxboot-admin/src/main/resources/db/migration/` 下新增 Flyway 脚本：
```
V12__create_notice.sql
```

### 前端（5 个文件）

在 `client/src/features/system/` 下新建：

```
notice/
├── types.ts              ← NoticeVO、NoticeCommand（与后端对称）
├── api.ts                ← useNotices、useCreateNotice、useUpdateNotice、useDeleteNotice
├── columns.tsx           ← 列定义（NxColumn<NoticeVO>[]）
└── pages/
    ├── NoticeList.tsx     ← 列表页（NxFilter + 工具栏 + Table + 权限按钮）
    └── NoticeForm.tsx     ← Drawer 表单（新增/编辑切换）
```

在 `client/src/app/routes.tsx` 中添加路由。
在 `client/src/app/layouts/BasicLayout.tsx` 的 `subsystems` 配置中添加菜单项。

### 核心模式参考

**以 `system/user/` 为模板**——这是最完整的参考实现，其他模块照着抄。

---

## 命名规范

| 类别 | 模式 | 示例 |
|------|------|------|
| VO（查询返回） | `XxxVO` | `UserVO`, `RoleVO` |
| Command（写入参数） | `XxxCommand.Create` / `XxxCommand.Update` | `UserCommand.Create` |
| Controller | `XxxController` | `UserController` |
| Service | `XxxService` | `UserService` |
| Repository | `XxxRepository` | `UserRepository` |
| API 路径 | `/api/v1/system/{领域复数}` | `/api/v1/system/users` |
| 权限标识 | `system:{领域}:{操作}` | `system:user:create` |
| 前端类型 | 与后端对称 | `UserVO`, `UserCommand` |
| 前端 API hook | `useXxxs` / `useCreateXxx` | `useUsers`, `useCreateUser` |

**注意：手写类不加 `Sys` 前缀**（包路径已提供命名空间）。

## 数据模型规范

```java
// VO — JDK Record，不可变，用于查询返回
public record UserVO(
    Long id,
    String username,
    String nickname,
    Boolean enabled,
    LocalDateTime createTime
) {}

// Command — 嵌套 Record，用于写入参数
public final class UserCommand {
    public record Create(
        @NotBlank String username,
        @NotBlank @Size(min = 6) String password
    ) {}
    public record Update(
        @NotNull Long id,
        String nickname,
        Boolean enabled
    ) {}
    private UserCommand() {}
}
```

- **不手写数据库实体类**——jOOQ 通过 DSL 直接操作表字段
- **不使用 MapStruct/Lombok**——JDK Record 自带 equals/hashCode/toString
- 每个领域只需 **2 个模型文件**（VO + Command）

## jOOQ 使用规范

已启用 jOOQ codegen，生成的类型安全引用在 `com.nxboot.generated.jooq`。新代码使用 codegen 引用，现有字符串引用逐步迁移。

### codegen 生成

```bash
cd server && mvn generate-sources -P codegen -pl nxboot-admin
```

详见 `server/CODEGEN.md`。

### 类型安全引用（推荐）

```java
import static com.nxboot.generated.jooq.tables.SysConfig.SYS_CONFIG;

// 表引用
dsl.select().from(SYS_CONFIG)

// 字段引用（编译期类型检查）
SYS_CONFIG.CONFIG_KEY.eq(key)

// 读取字段值（无需手动指定类型）
r.get(SYS_CONFIG.ID)
r.get(SYS_CONFIG.CREATE_TIME)
```

### 字符串引用（旧代码，逐步迁移中）

```java
// 仍可工作，但不推荐新代码使用
dsl.select().from(table("sys_config")).where(field("config_key").eq(key))
r.get("create_time", LocalDateTime.class)
```

### 审计字段

当前需要在每次 insert/update 时手动填充 `create_by`、`create_time`、`update_by`、`update_time`、`deleted`。

## 前端开发规范

### 列定义（NxColumn）

```tsx
// features/system/xxx/columns.tsx
import type { NxColumn } from "@/shared/components/NxTable";
import dayjs from "dayjs";

export const xxxColumns: NxColumn<XxxVO>[] = [
  { field: "name", title: "名称", width: 150 },
  {
    field: "enabled",
    title: "状态",
    width: 90,
    render: (v: boolean) => <Tag color={v ? "success" : "error"}>{v ? "正常" : "停用"}</Tag>,
  },
  {
    field: "createTime",
    title: "创建时间",
    width: 170,
    render: (v: string) => v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-",
  },
];
```

**注意**：使用 `NxColumn` 而非 antd 的 `ColumnsType`，字段名用 `field` 而非 `dataIndex`。操作列 field 用 `"_action"`。

### 列表页模式

```tsx
// 标准列表页结构
<NxDrawer.Root>
  <NxFilter ... />                          {/* 搜索栏 */}
  <NxBar
    left={<Button type="primary">新增</Button>}
    right={<Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>}
  />
  <NxTable columns={columns} data={list} loading={isLoading} pagination={{...}} />
  <NxDrawer.Content title="..."><XxxForm /></NxDrawer.Content>
</NxDrawer.Root>
```

### 权限控制

```typescript
import { usePerm } from '@/shared/hooks/usePerm';

const { has } = usePerm();
{has('system:xxx:create') && <Button type="primary">新增</Button>}
```

### 页面模式

| 场景 | 组件选择 |
|------|---------|
| 普通列表页（用户/角色/配置/日志/文件/任务） | NxTable + columns.tsx |
| 树形结构（菜单） | NxTable expandable |
| 主从关系（字典类型+数据） | Ant Design List 左右分栏 |

### 请求封装

`src/app/request.ts` 导出 `get<T>`, `post<T>`, `put<T>`, `del<T>` 四个函数，自动解包 `R<T>`，直接返回 `data`。401 自动跳登录页。

### CSS 变量（tokens.css）

```css
--color-primary: #1677ff;
--color-primary-bg: #e6f4ff;
--color-primary-border: #91caff;
--color-header-bg: #2563eb;
--color-bg-page: #f5f5f5;
--color-border: #f0f0f0;
```

布局组件中使用 CSS 变量而非硬编码颜色。

---

## 构建与运行

### 后端

```bash
cd server
mvn clean package -DskipTests     # 快速打包（跳过测试）
mvn verify                        # 运行全部集成测试 + JaCoCo 聚合覆盖率

# 开发环境（必须显式指定 profile）
java -jar nxboot-admin/target/nxboot-admin.jar --spring.profiles.active=dev

# 生产环境（必须配置环境变量）
java -jar nxboot-admin/target/nxboot-admin.jar --spring.profiles.active=prod
```

> **安全设计**：不指定 profile 时 JWT secret 未配置，应用会启动失败。dev profile 提供开发默认值，prod 必须通过环境变量配置。

覆盖率报告：`server/target/site/jacoco-aggregate/index.html`

### 前端

```bash
cd client
pnpm install
pnpm dev        # 开发服务器（代理 /api → localhost:8080）
pnpm build      # 生产构建
pnpm test       # Vitest 测试
pnpm test --coverage   # 带覆盖率
```

覆盖率报告：`client/coverage/index.html`

### 环境变量（生产必配）

| 变量 | 说明 |
|------|------|
| `NXBOOT_JWT_SECRET` | JWT 签名密钥（至少 256 位），非 dev 环境必须配置 |
| `DB_URL` | PostgreSQL 连接地址 |
| `DB_USERNAME` | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 |
| `NXBOOT_CORS_ORIGINS` | CORS 允许的前端来源（逗号分隔），未配置时禁止跨域 |
| `nxboot.file.storage-type` | 文件存储类型：`local`（默认）或 `oss` |
| `nxboot.file.upload-dir` | 本地存储路径（默认 `./uploads`） |

---

## Git 工作流

- **小步快走**：每完成一个小功能或任务，立即执行一次原子化 commit
- **不攒批**：不要把多个不相关的功能改动合并到一个 commit 中
- **commit message**：中文，简洁描述变更内容，格式 `feat/fix/docs/refactor：xxx`
- **自动提交**：功能完成后主动 commit，不需要等用户说"提交"
- **为什么**：清晰的 git 历史便于代码回退，也方便 AI 通过 `git diff`/`git log` 分析变化历史

## 红蓝演练与产品级验收

- **先看协议**：从切换点之后的新提交开始，按 `REVIEW_PROTOCOL.md` 执行
- **交卷模板**：submission 使用 `REVIEW_SUBMISSION_TEMPLATE.md`
- **切换规则**：如果当前任务已在旧流程中进行，允许本轮收尾，不追溯返工；从下一次原子提交开始正式切换
- **交卷要求**：提交前先自检，再整理目标、用户场景、假设、改动范围、风险点、验证命令、验证结果、未解决事项
- **状态标记**：完成交卷后将状态标记为 `READY_FOR_REVIEW`
- **验收目标**：红队会从产品体验、正确性、架构边界、安全、数据迁移、可运维性等维度审查，不是只看代码是否能运行

---

## Guides 索引

以下文件按需读取，不要预加载：
- `.claude/guides/nxboot-dev-sop.md` — **本地开发 SOP（构建/启动/测试/排障）—— 改了代码要验证时必读**

## Rules 踩坑知识库

- 位置：`.claude/rules/`，索引文件 `INDEX.md`
- **做事前**：读 `INDEX.md` 扫一眼触发场景，命中了再读具体 rule
- **做事后**：踩了新坑就沉淀，写 rule + 更新 INDEX.md

---

## 禁止事项

- **不要**手写 SQL 字符串拼接（用 jOOQ DSL 的参数化查询）
- **不要**在 Controller 里写业务逻辑（业务逻辑在 Service 层）
- **不要**跨领域包直接调用 Repository（通过 Service 调）
- **不要**用 Lombok（用 JDK Record）
- **不要**用 MapStruct（jOOQ fetchInto 或手动构造）
- **不要**在前端用 `any` 类型
- **不要**硬编码颜色/间距值（用 CSS 变量）
- **不要**绕过 `request.ts` 直接用 axios
- **不要**在 commit 中包含 `application-prod.yml` 的真实密码

## 已知限制

- DataScopeAspect 中 5 处 `DSL.field()` 为运行时动态别名，无法用 codegen 替代
- 图标全量导入（`import * as Icons`）——动态 icon 名无法 tree-shake，需从菜单表单端加 icon picker 约束
- 前端业务页面已全量 i18n 覆盖，**菜单名称仍来自 DB**，需后续菜单 i18n 机制
- WebSocket 单节点支持，多节点部署需 Redis Pub/Sub 广播
- `AuditHelper` 对 List 字段采用顺序无关比较，可能掩盖业务排序语义（如菜单顺序）
- V27 索引迁移在大数据量表需手动 `CONCURRENTLY` 执行（已在迁移头部注释中说明）
- Phase 4 插件机制尚未启动
- 无代码生成器

更多历史细节和版本变更见 [CHANGELOG.md](./CHANGELOG.md)。
