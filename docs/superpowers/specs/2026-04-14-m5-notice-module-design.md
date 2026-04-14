# M5: Notice（通知公告）Canonical Reference 模块设计

## 1. 目标

在 M4 后端底座 + M3 前端壳层之上，实现第一个完整的前后端贯通业务模块 **notice（通知公告）**，作为 canonical reference：

1. **验证 12 步清单**的可行性（从 DDL 到 E2E 全流程）
2. **搭建 OpenAPI 契约管线**（springdoc → openapi.json → typescript-fetch → 类型安全消费）
3. **为 v1.5 Spec 引擎提供反向提炼样本**（notice 的代码结构就是 Spec 引擎的输入模式）

## 2. 业务模型

### 2.1 核心实体：Notice（通知公告）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (Snowflake) | 主键 |
| tenant_id | BIGINT DEFAULT 0 | 多租户预留 |
| title | VARCHAR(200) NOT NULL | 标题 |
| content | TEXT | 富文本内容（HTML） |
| status | SMALLINT NOT NULL DEFAULT 0 | 0=草稿 1=已发布 2=已撤回 |
| pinned | BOOLEAN NOT NULL DEFAULT FALSE | 置顶 |
| start_time | TIMESTAMPTZ | 生效时间（NULL=立即生效） |
| end_time | TIMESTAMPTZ | 失效时间（NULL=永不失效） |
| owner_dept_id | BIGINT NOT NULL DEFAULT 0 | 数据权限（创建者部门） |
| version | INT NOT NULL DEFAULT 0 | 乐观锁 |
| created_by | BIGINT NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT now() | 创建时间 |
| updated_by | BIGINT NOT NULL | 更新人 |
| updated_at | TIMESTAMPTZ NOT NULL DEFAULT now() | 更新时间 |

### 2.2 附件关联

不单独建表，复用 `mb_file_metadata` 表 + 一张关联表：

| 表名 | 字段 | 说明 |
|------|------|------|
| mb_notice_attachment | id, notice_id, file_id, sort_order, created_at | notice ↔ file 多对多 |

### 2.3 状态机

```
DRAFT(0) ──publish──→ PUBLISHED(1)
                          │
                       revoke
                          │
                          ▼
                      REVOKED(2) ──publish──→ PUBLISHED(1)
```

- 草稿可发布
- 已发布可撤回
- 已撤回可重新发布
- 只有草稿可删除

### 2.4 权限点

| 权限码 | 场景 |
|--------|------|
| `notice:notice:list` | 列表页 |
| `notice:notice:detail` | 详情页 |
| `notice:notice:create` | 新增 |
| `notice:notice:update` | 编辑 |
| `notice:notice:delete` | 删除（仅草稿） |
| `notice:notice:publish` | 发布/撤回 |
| `notice:notice:export` | Excel 导出 |

## 3. 后端设计

### 3.1 模块结构

```
server/mb-business/business-notice/
├── pom.xml
└── src/main/java/com/metabuild/business/notice/
    ├── api/
    │   ├── NoticeApi.java                    # 跨模块接口
    │   └── dto/
    │       ├── NoticeView.java               # 列表/详情响应
    │       ├── NoticeDetailView.java          # 详情（含附件列表）
    │       ├── NoticeCreateCommand.java       # 新增请求
    │       ├── NoticeUpdateCommand.java       # 编辑请求
    │       └── NoticeQuery.java              # 查询条件
    ├── domain/
    │   ├── NoticeService.java                # 业务逻辑 + 状态机
    │   ├── NoticeRepository.java             # jOOQ 数据访问
    │   └── NoticeAttachmentRepository.java   # 附件关联
    ├── web/
    │   └── NoticeController.java             # REST 端点
    └── config/
        └── NoticeAutoConfiguration.java      # Spring Boot 自动配置
```

### 3.2 API 端点

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/notices` | `notice:notice:list` | 分页列表（支持 status/keyword/dateRange 筛选） |
| GET | `/api/v1/notices/{id}` | `notice:notice:detail` | 详情（含附件列表） |
| POST | `/api/v1/notices` | `notice:notice:create` | 新增（草稿） |
| PUT | `/api/v1/notices/{id}` | `notice:notice:update` | 编辑 |
| DELETE | `/api/v1/notices/{id}` | `notice:notice:delete` | 删除（仅草稿） |
| POST | `/api/v1/notices/{id}/publish` | `notice:notice:publish` | 发布 |
| POST | `/api/v1/notices/{id}/revoke` | `notice:notice:publish` | 撤回 |
| GET | `/api/v1/notices/export` | `notice:notice:export` | Excel 导出 |

### 3.3 DTO 定义

**NoticeView**（列表响应）：
```java
public record NoticeView(
    Long id,
    String title,
    int status,          // 0=draft, 1=published, 2=revoked
    boolean pinned,
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") Instant startTime,
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") Instant endTime,
    String createdByName,
    Instant createdAt,
    Instant updatedAt
) {}
```

**NoticeDetailView**（详情响应，extends NoticeView 概念）：
```java
public record NoticeDetailView(
    Long id,
    String title,
    String content,      // HTML 富文本
    int status,
    boolean pinned,
    Instant startTime,
    Instant endTime,
    List<AttachmentView> attachments,
    String createdByName,
    Instant createdAt,
    Instant updatedAt,
    int version
) {}
```

**NoticeCreateCommand**：
```java
public record NoticeCreateCommand(
    @NotBlank @Size(max = 200) String title,
    String content,
    boolean pinned,
    Instant startTime,
    Instant endTime,
    List<Long> attachmentFileIds   // 关联已上传的文件 ID
) {}
```

**NoticeUpdateCommand**：
```java
public record NoticeUpdateCommand(
    @NotBlank @Size(max = 200) String title,
    String content,
    boolean pinned,
    Instant startTime,
    Instant endTime,
    List<Long> attachmentFileIds,
    @NotNull Integer version       // 乐观锁
) {}
```

**NoticeQuery**：
```java
public record NoticeQuery(
    Integer status,
    String keyword,
    Instant startTimeFrom,
    Instant startTimeTo,
    Integer page,
    Integer size,
    String sort                    // e.g. "createdAt,desc"
) {}
```

### 3.4 集成点

| 集成 | 方式 |
|------|------|
| **platform-file** | NoticeService 注入 FileRepository 验证文件存在性；附件关联写 mb_notice_attachment |
| **platform-oplog** | Controller 方法加 `@OperationLog(module = "notice", operation = "创建公告")` |
| **infra-security** | Controller 方法加 `@RequirePermission("notice:notice:create")`；Service 注入 CurrentUser 获取操作人 |
| **infra-cache** | 详情页可选缓存（key: `mb:notice:detail:{id}`），mutation 时 evict |
| **infra-jooq** | Repository 使用 DSLContext；DataScopeVisitListener 自动注入数据权限 |

### 3.5 Excel 导出

使用 EasyExcel（轻量，低内存）：
- Controller `GET /notices/export` 接受与列表相同的筛选参数
- Service 流式查询 → EasyExcel 写入 → 返回 `StreamingResponseBody`
- 文件名：`公告列表_20260414.xlsx`

### 3.6 测试

`mb-admin/src/test/java/com/metabuild/admin/notice/NoticeIntegrationTest.java`：

| 测试用例 | 验证 |
|---------|------|
| 创建草稿 | 201 + 字段正确 |
| 编辑草稿 | 200 + 字段更新 |
| 发布 | 状态 0→1 |
| 撤回 | 状态 1→2 |
| 重新发布 | 状态 2→1 |
| 删除草稿 | 204 |
| 删除非草稿 | 400（状态不允许） |
| 分页查询 | 分页 + 筛选 + 排序 |
| 带附件创建 | 附件关联正确 |
| 乐观锁冲突 | 409 |
| 权限不足 | 403 |
| 导出 | 200 + Content-Type xlsx |

## 4. OpenAPI 契约管线

### 4.1 后端生成

`server/mb-admin/pom.xml` 添加 springdoc-openapi-starter-webmvc-api 依赖 + maven 插件：

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-api</artifactId>
    <version>2.8.0</version>
</dependency>
```

`application.yml`：
```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  show-actuator: false
  default-produces-media-type: application/json
```

生成命令：
```bash
cd server && mvn spring-boot:run -pl mb-admin &
# 等启动完成后
curl http://localhost:8080/v3/api-docs > api-contract/openapi-v1.json
kill %1
```

或使用 springdoc-openapi-maven-plugin 自动化：
```bash
cd server && mvn verify -pl mb-admin -Dspringdoc.generate=true
```

### 4.2 前端消费

`client/package.json` 新增 script：
```json
"generate:api-sdk": "openapi-generator-cli generate -i ../server/api-contract/openapi-v1.json -g typescript-fetch -o packages/api-sdk/src/generated --additional-properties=supportsES6=true,typescriptThreePlus=true"
```

生成后目录：
```
packages/api-sdk/src/
├── generated/           # 自动生成（NOT in git）
│   ├── apis/
│   │   ├── NoticeApi.ts
│   │   ├── AuthApi.ts
│   │   └── MenuApi.ts
│   ├── models/
│   │   ├── NoticeView.ts
│   │   ├── NoticeCreateCommand.ts
│   │   └── ...
│   └── runtime.ts
├── index.ts             # 手写 facade（重新导出 generated + interceptors）
├── config.ts            # configureApiSdk（不变）
├── interceptors/        # 4 个拦截器（不变）
└── errors.ts            # ProblemDetailError（不变）
```

**M3 手写类型 → 迁移到 generated/**：
- `types/auth.ts`、`types/menu.ts`、`types/permission.ts`、`types/common.ts` 中的手写类型被 generated/models/ 替代
- `apis/auth-api.ts`、`apis/menu-api.ts` 被 generated/apis/ 替代
- `index.ts` 改为从 generated/ 重新导出
- interceptors/ 和 errors.ts 保留不变（手写层）

### 4.3 CI 集成

```yaml
# .github/workflows/ci.yml
- name: Generate API SDK
  run: |
    cd server && mvn springdoc:generate -pl mb-admin
    cd ../client && pnpm generate:api-sdk
- name: Type check (catches contract drift)
  run: cd client && pnpm check:types
```

## 5. 前端设计

### 5.1 路由结构

```
apps/web-admin/src/routes/_authed/
├── notices/
│   ├── index.tsx          # /notices — 列表页
│   └── $id.tsx            # /notices/$id — 详情页
```

### 5.2 i18n 字典

`apps/web-admin/src/i18n/zh-CN/notice.json`：
```json
{
  "title": "通知公告",
  "list": { "title": "公告列表", "empty": "暂无公告", "export": "导出 Excel" },
  "form": { "title": "公告标题", "content": "公告内容", "pinned": "置顶", "startTime": "生效时间", "endTime": "失效时间", "attachments": "附件" },
  "status": { "draft": "草稿", "published": "已发布", "revoked": "已撤回" },
  "action": { "create": "新增公告", "edit": "编辑", "delete": "删除", "publish": "发布", "revoke": "撤回", "confirmDelete": "确定删除此公告？", "confirmPublish": "确定发布此公告？", "confirmRevoke": "确定撤回此公告？" },
  "filter": { "status": "状态", "keyword": "关键词", "dateRange": "日期范围" },
  "batch": { "selected": "已选择 {count} 项", "delete": "批量删除", "publish": "批量发布" }
}
```

`apps/web-admin/src/i18n/en-US/notice.json`：对应英文翻译。

### 5.3 列表页（/notices）

```
┌─────────────────────────────────────────────────────────┐
│ 公告列表                                    [新增公告] [导出] │
├─────────────────────────────────────────────────────────┤
│ NxFilter: [状态 ▼] [关键词____] [日期范围____] [查询] [重置]  │
├─────────────────────────────────────────────────────────┤
│ NxTable:                                                │
│ ☐ │ 📌 │ 标题          │ 状态   │ 生效时间  │ 创建人 │ 操作  │
│ ☐ │ 📌 │ 系统升级通知    │ 已发布 │ 2026-04-14│ admin │ [详情]│
│ ☐ │    │ 节假日安排      │ 草稿  │ —        │ admin │ [编辑]│
├─────────────────────────────────────────────────────────┤
│ NxBar: 已选择 2 项  [批量删除] [批量发布]    共 15 条 第1/2页 │
└─────────────────────────────────────────────────────────┘
```

组件组合：
- `NxFilter`：状态下拉（全部/草稿/已发布/已撤回）+ 关键词 + 日期范围
- `NxTable`：columns 定义 + 排序 + 分页 + 行选择
- `NxBar`：批量删除（仅草稿）+ 批量发布
- 操作列：根据状态显示不同按钮（详情/编辑/发布/撤回/删除），受权限控制

### 5.4 新增/编辑（NxDrawer）

```
┌──────────────────────── NxDrawer ─────────────────────┐
│ 新增公告                                          [×]  │
├───────────────────────────────────────────────────────┤
│ NxForm:                                               │
│   标题 *  [__________________________]                 │
│   内容    [富文本编辑器________________]                 │
│           [                            ]                │
│   置顶    [☐]                                          │
│   生效时间 [____-__-__ __:__]                           │
│   失效时间 [____-__-__ __:__]                           │
│   附件    [上传附件] 已上传: file1.pdf, file2.docx      │
├───────────────────────────────────────────────────────┤
│                              [取消]  [保存]             │
└───────────────────────────────────────────────────────┘
```

- NxDrawer 表单模式（有 schema）
- Zod 验证：title 必填 + max 200
- 富文本编辑器：使用 TipTap（Prosemirror-based，React 生态主流）
- 附件上传：调用 platform-file 的上传 API，获取 fileId 列表

### 5.5 详情页（/notices/$id）

独立页面（非 Drawer），展示：
- 标题 + 状态 Badge + 置顶标记
- 富文本内容渲染（dangerouslySetInnerHTML + DOMPurify 安全处理）
- 附件下载列表
- 操作按钮（发布/撤回/编辑/删除，根据状态 + 权限动态显示）
- 返回列表按钮

### 5.6 权限守卫

```tsx
// routes/_authed/notices/index.tsx
export const Route = createFileRoute('/_authed/notices/')({
  beforeLoad: requireAuth({ permission: 'notice:notice:list' }),
  component: NoticeList,
});

// 按钮级权限
const user = useCurrentUser();
{user.hasPermission('notice:notice:create') && <Button onClick={openCreate}>新增</Button>}
{user.hasPermission('notice:notice:publish') && status === 0 && <Button onClick={publish}>发布</Button>}
```

### 5.7 富文本编辑器

**选型：TipTap**
- Prosemirror-based，React 生态最流行
- 支持 toolbar 定制、图片上传、表格、代码块
- 输出 HTML，存到后端 content 字段
- 阅读模式用 `<div dangerouslySetInnerHTML>` + DOMPurify 净化

依赖：
```json
"@tiptap/react": "^2.10.0",
"@tiptap/starter-kit": "^2.10.0",
"@tiptap/extension-image": "^2.10.0",
"@tiptap/extension-placeholder": "^2.10.0",
"dompurify": "^3.2.0"
```

### 5.8 E2E 测试（Playwright）

`apps/web-admin/e2e/notice.spec.ts`：

| 测试场景 | 步骤 |
|---------|------|
| 新增草稿 | 登录 → 进公告列表 → 新增 → 填写 → 保存 → 列表出现新条目 |
| 编辑草稿 | 点编辑 → 修改标题 → 保存 → 标题更新 |
| 发布 | 选中草稿 → 点发布 → 确认 → 状态变为"已发布" |
| 撤回 | 选中已发布 → 点撤回 → 确认 → 状态变为"已撤回" |
| 删除草稿 | 选中草稿 → 点删除 → 确认 → 从列表消失 |
| 批量操作 | 勾选多条 → 批量发布 → 全部状态更新 |
| 导出 | 点导出 → 下载 xlsx 文件 |
| 权限控制 | 无 publish 权限的用户看不到发布按钮 |
| 详情页 | 点标题 → 进入详情 → 内容正确渲染 + 附件列表 |

## 6. 数据流

```
用户操作 → L5 Route Component
  → useQuery/useMutation（TanStack Query）
    → @mb/api-sdk generated NoticeApi
      → http-client + interceptors（auth/language/request-id/error + auto-refresh）
        → Vite proxy → Backend Controller
          → @RequirePermission → @OperationLog → Service → Repository → jOOQ → PostgreSQL
```

## 7. 开发顺序

```
Phase 1: OpenAPI 管线搭建
  ├── 后端 springdoc 配置 + openapi.json 生成
  ├── 前端 openapi-generator 配置 + generated/ 目录
  └── api-sdk index.ts 重构（从 generated/ 重新导出）

Phase 2: 后端 notice 模块
  ├── DDL（mb_notice + mb_notice_attachment）
  ├── jOOQ codegen
  ├── Repository + Service + Controller
  ├── 附件集成（platform-file）
  ├── 操作日志（@OperationLog）
  ├── Excel 导出（EasyExcel）
  └── 集成测试

Phase 3: 前端 notice 模块
  ├── 路由 + 权限声明
  ├── i18n 字典
  ├── 列表页（NxTable + NxFilter + NxBar）
  ├── 新增/编辑（NxDrawer + NxForm + TipTap + 附件上传）
  ├── 详情页（富文本渲染 + 附件下载）
  └── 按钮级权限

Phase 4: E2E + 质量
  ├── Playwright 测试
  ├── 全量质量门禁
  └── 文档更新
```

## 8. 新增依赖

### 后端
| 依赖 | 版本 | 用途 |
|------|------|------|
| `springdoc-openapi-starter-webmvc-api` | 2.8.0 | OpenAPI 生成 |
| `com.alibaba:easyexcel` | 4.0.0+ | Excel 导出 |

### 前端
| 依赖 | 包 | 用途 |
|------|-----|------|
| `@openapitools/openapi-generator-cli` | 根 devDep | OpenAPI → TypeScript |
| `@tiptap/react` + `@tiptap/starter-kit` + extensions | web-admin | 富文本编辑 |
| `dompurify` + `@types/dompurify` | web-admin | HTML 净化 |

## 9. 质量标准（ADR-0006 P0 对标）

| P0 维度 | notice 如何满足 |
|---------|----------------|
| P0.1 12 步清单 | 严格遵循，每步有 commit |
| P0.2 HikariCP | 复用 M4 配置 |
| P0.3 缓存策略 | 详情缓存 `mb:notice:detail:{id}`，mutation evict |
| P0.4 定时任务 | 可选：到期自动下架（@Scheduled + ShedLock） |
| P0.5 文件存储 | 附件通过 platform-file |
| P0.6 操作日志 | @OperationLog 全覆盖 |
