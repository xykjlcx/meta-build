# M5: Notice + 通知生态 + SSE 实时能力 — 设计文档 v3

## 1. 目标

M5 不只是一个 CRUD demo，而是围绕 **notice（通知公告）** 构建完整的通知生态：

1. **OpenAPI 契约管线** — springdoc → openapi.json → **orval** → TanStack Query hooks + query key factory + MSW mock
2. **Notice CRUD** — 公告管理的完整前后端贯通（12 步清单首次实战）+ 已读/未读 + 多态通知目标
3. **SSE 基础设施** — 业务无关的实时消息管道（**infra-sse**，`SseEmitter` 零额外依赖）
4. **通知渠道系统** — platform-notification 升级：站内信 + Email + 微信公众号 + 微信小程序（含绑定流程）
5. **实时能力** — 踢人下线 / 权限变更推送 / 系统广播 / 公告发布推送

### 1.1 定位划分

| 层 | 模块 | 职责 |
|----|------|------|
| **infra** | `infra-sse` | SSE 连接管理、认证（HTTP Authorization header）、心跳、Session 管理（业务无关） |
| **platform** | `platform-notification`（已有，升级） | 通知渠道抽象 + 分发调度（AFTER_COMMIT + @Async） + 发送记录 + 模板管理 |
| **business** | `business-notice` | 公告 CRUD + 状态机 + 附件 + 多态 target + 已读/未读 + Excel 导出（消费 notification 分发公告） |

### 1.2 关键决策索引

| # | 决策 | 结论 |
|---|------|------|
| 1 | OpenAPI 生成工具 | **orval**（替代 openapi-generator-cli） |
| 2 | 实时推送 | **SSE**（替代 WebSocket + STOMP） |
| 3 | 微信绑定 | M5 全做（公众号 OAuth + 小程序 wx.login） |
| 4 | 敏感配置 | 环境变量注入（不存 platform-config 表） |
| 5 | 通知目标 | 多态 target + 写入时展开 recipient |
| 6 | 已读/未读 | M5 做（`read_at` NULL=未读） |
| 7 | Excel 导出 | **FastExcel**（`cn.idev.excel:fastexcel`） |
| 8 | ADR-0013 | SSE 实时推送 M5 实施（不是 WebSocket 提前） |
| 9 | 通知分发模型 | `@TransactionalEventListener(AFTER_COMMIT)` + `@Async` + 渠道并行 |

---

## 2. OpenAPI 契约管线（orval）

### 2.1 后端生成

`server/mb-admin/pom.xml` 添加依赖：
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-api</artifactId>
    <version>2.8.0</version>
</dependency>
```

Controller 方法加 `@Operation` / `@Parameter` 注解增强 OpenAPI 描述。

生成流程：
```
mvn spring-boot:run -pl mb-admin
curl http://localhost:8080/v3/api-docs -o server/api-contract/openapi-v1.json
# 或使用 springdoc-openapi-maven-plugin 自动化
```

`server/api-contract/openapi-v1.json` **提交到 git**（作为契约基线）。

### 2.2 前端消费（orval）

**安装**：
```bash
# 根 devDependency
pnpm add -Dw orval
```

**配置** `client/orval.config.ts`：
```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  metaBuild: {
    input: {
      target: '../server/api-contract/openapi-v1.json',
    },
    output: {
      target: './packages/api-sdk/src/generated/endpoints',
      schemas: './packages/api-sdk/src/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'tags-split',
      mock: true,  // 生成 MSW mock handlers
      override: {
        mutator: {
          path: './packages/api-sdk/src/custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
```

**mutator 函数** `client/packages/api-sdk/src/custom-instance.ts`：
```typescript
// 封装现有拦截器链（auth/language/request-id/error/refresh）
import { getToken, refreshToken, clearAuth } from '@mb/app-shell/auth';
import { getCurrentLanguage } from '@mb/app-shell/i18n';
import { nanoid } from 'nanoid';
import { ProblemDetailError } from './errors';

export const customInstance = async <T>(config: {
  url: string;
  method: string;
  params?: Record<string, string>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}): Promise<T> => {
  const { url, method, params, data, headers = {}, signal } = config;

  const queryString = params
    ? '?' + new URLSearchParams(params).toString()
    : '';

  const token = getToken();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': getCurrentLanguage(),
    'X-Request-ID': nanoid(),
    ...headers,
  };
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${url}${queryString}`, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    signal,
  });

  // 401 → 尝试 refresh
  if (response.status === 401 && token) {
    const refreshed = await refreshToken();
    if (refreshed) {
      requestHeaders['Authorization'] = `Bearer ${getToken()}`;
      response = await fetch(`${url}${queryString}`, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal,
      });
    } else {
      clearAuth();
      throw new ProblemDetailError({ status: 401, title: 'Unauthorized', detail: 'Token expired' });
    }
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => ({
      status: response.status,
      title: response.statusText,
      detail: 'Unknown error',
    }));
    throw new ProblemDetailError(problem);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};

export default customInstance;
```

**生成后目录结构**：
```
packages/api-sdk/src/
├── generated/            # orval 输出（NOT in git，.gitignore 排除）
│   ├── endpoints/        # 按 tag 分割的 TanStack Query hooks + 纯 async 函数
│   │   ├── notice.ts     # useGetNotices(), useCreateNotice(), getNoticesQueryKey() 等
│   │   ├── auth.ts
│   │   └── ...
│   ├── models/           # TypeScript 接口（NoticeView, NoticeCreateCommand 等）
│   │   └── index.ts
│   └── mocks/            # MSW mock handlers（开发/测试用）
│       └── index.ts
├── custom-instance.ts    # mutator 函数（封装拦截器链）
├── index.ts              # 统一导出（generated/ + 手写类型）
├── config.ts             # configureApiSdk（不变）
├── interceptors/         # 4 个拦截器 + refresh 逻辑（保留，custom-instance 内部使用）
├── errors.ts             # ProblemDetailError（不变）
└── types/                # 手写类型（保留，不被 generated/ 替代）
    ├── permissions.ts    # AppPermission 联合类型
    ├── page-result.ts    # PageResult<T> 泛型
    └── index.ts          # 统一导出
```

**手写类型保留说明**：`AppPermission`（前端权限联合类型，后端不生成）和 `PageResult<T>`（泛型包装，OpenAPI 无法精确表达）保留在 `types/` 目录。`index.ts` 统一导出 generated + types，业务代码无感知。

**生成命令**：
```bash
pnpm generate:api-sdk
# 等价于：cd client && npx orval --config orval.config.ts
```

### 2.3 CI 集成

```yaml
# .github/workflows/ci.yml — client job
steps:
  - name: Install dependencies
    run: cd client && pnpm install
  - name: Generate API SDK
    run: cd client && pnpm generate:api-sdk    # 从 committed openapi-v1.json 生成
  - name: Type check
    run: cd client && pnpm check:types         # 类型不匹配 = 契约 drift
  - name: Lint
    run: cd client && pnpm lint
```

CI 不启动后端，直接用 committed 的 `openapi-v1.json`。

**drift 检测**：CI 增加 step 比对 `openapi-v1.json` 与运行时 `/v3/api-docs` 输出（需后端集成测试环境），若不一致则 fail：
```yaml
  - name: Check OpenAPI drift
    run: |
      # 在后端集成测试 step 中生成最新 openapi.json
      diff server/api-contract/openapi-v1.json server/mb-admin/target/openapi.json
```

### 2.4 dep-cruiser 规则适配

orval 生成路径为 `packages/api-sdk/src/generated/`，dep-cruiser 规则需允许 L5 导入该路径：
```javascript
// .dependency-cruiser.cjs — 已有 api-sdk 豁免规则覆盖 generated/ 子目录
// 无需额外配置，但需确认 glob 模式匹配 generated/endpoints/* 和 generated/models/*
```

---

## 3. Notice（通知公告）业务模块

### 3.1 模块位置

`server/mb-business/business-notice/`（CLAUDE.md：mb-business = 使用者扩展位 + canonical reference）

包结构：`com.metabuild.business.notice.{api, domain, web, config}`

### 3.2 DDL

**`V20260615_001__notice.sql`**：

```sql
-- ===== 通知公告主表 =====
CREATE TABLE biz_notice (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,                        -- 富文本 HTML（后端 jsoup 净化）
    status          SMALLINT NOT NULL DEFAULT 0, -- 0=草稿 1=已发布 2=已撤回
    pinned          BOOLEAN NOT NULL DEFAULT FALSE,
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    owner_dept_id   BIGINT NOT NULL DEFAULT 0,   -- 数据权限字段
    version         INT NOT NULL DEFAULT 0,      -- 乐观锁
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_tenant_status ON biz_notice (tenant_id, status);
CREATE INDEX idx_notice_tenant_created ON biz_notice (tenant_id, created_at DESC);
CREATE INDEX idx_notice_tenant_dept ON biz_notice (tenant_id, owner_dept_id);
CREATE INDEX idx_notice_pinned ON biz_notice (tenant_id, pinned DESC, created_at DESC);

COMMENT ON TABLE biz_notice IS '通知公告';
COMMENT ON COLUMN biz_notice.id IS '主键（Snowflake）';
COMMENT ON COLUMN biz_notice.tenant_id IS '租户 ID（v1 默认 0）';
COMMENT ON COLUMN biz_notice.title IS '公告标题';
COMMENT ON COLUMN biz_notice.content IS '公告内容（富文本 HTML，后端 jsoup 净化）';
COMMENT ON COLUMN biz_notice.status IS '状态：0=草稿 1=已发布 2=已撤回';
COMMENT ON COLUMN biz_notice.pinned IS '是否置顶';
COMMENT ON COLUMN biz_notice.start_time IS '生效开始时间';
COMMENT ON COLUMN biz_notice.end_time IS '生效结束时间';
COMMENT ON COLUMN biz_notice.owner_dept_id IS '所属部门 ID（数据权限）';
COMMENT ON COLUMN biz_notice.version IS '乐观锁版本号';
COMMENT ON COLUMN biz_notice.created_by IS '创建人 ID';
COMMENT ON COLUMN biz_notice.created_at IS '创建时间';
COMMENT ON COLUMN biz_notice.updated_by IS '最后修改人 ID';
COMMENT ON COLUMN biz_notice.updated_at IS '最后修改时间';

-- ===== 通知目标表（多态关联）=====
-- 发布时指定的目标对象（全员/部门/角色/指定用户）
CREATE TABLE biz_notice_target (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    target_type     VARCHAR(20) NOT NULL,   -- ALL / DEPT / ROLE / USER
    target_id       BIGINT,                 -- 对应 ID（ALL 时为 NULL）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_target_notice ON biz_notice_target (notice_id);

COMMENT ON TABLE biz_notice_target IS '通知目标（多态关联：全员/部门/角色/用户）';
COMMENT ON COLUMN biz_notice_target.target_type IS '目标类型：ALL=全员 DEPT=部门 ROLE=角色 USER=指定用户';
COMMENT ON COLUMN biz_notice_target.target_id IS '目标 ID（ALL 时为 NULL，DEPT=部门ID，ROLE=角色ID，USER=用户ID）';

-- ===== 通知接收人表（发布时展开到具体用户）=====
-- 查询用 recipient 表（WHERE user_id = ?）极简
CREATE TABLE biz_notice_recipient (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    read_at         TIMESTAMPTZ,            -- NULL=未读，有值=已读
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uk_notice_recipient ON biz_notice_recipient (notice_id, user_id);
CREATE INDEX idx_notice_recipient_user ON biz_notice_recipient (user_id, read_at);
CREATE INDEX idx_notice_recipient_notice ON biz_notice_recipient (notice_id);

COMMENT ON TABLE biz_notice_recipient IS '通知接收人（发布时从 target 展开到具体用户）';
COMMENT ON COLUMN biz_notice_recipient.read_at IS '已读时间（NULL=未读）';

-- ===== 公告附件关联表 =====
CREATE TABLE biz_notice_attachment (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    file_id         BIGINT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_att_notice ON biz_notice_attachment (notice_id);
CREATE INDEX idx_notice_att_file ON biz_notice_attachment (file_id);

COMMENT ON TABLE biz_notice_attachment IS '公告附件关联';
COMMENT ON COLUMN biz_notice_attachment.tenant_id IS '租户 ID';
COMMENT ON COLUMN biz_notice_attachment.created_by IS '创建人 ID';
```

表前缀 `biz_`（business 层，区别于平台层 `mb_`）。

**jOOQ codegen includes 模式**更新为 `(mb_|biz_).*`（覆盖 business 层表）。

### 3.3 状态机

```
DRAFT(0) ──publish──→ PUBLISHED(1) ──revoke──→ REVOKED(2) ──publish──→ PUBLISHED(1)
```

约束：只有 DRAFT 可删除。编辑不限状态（已发布的也可以编辑标题/内容）。

### 3.4 API 端点

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/notices` | `notice:notice:list` | 分页列表 → `PageResult<NoticeView>` |
| GET | `/api/v1/notices/{id}` | `notice:notice:detail` | 详情（含附件）→ `NoticeDetailView` |
| POST | `/api/v1/notices` | `notice:notice:create` | 新增草稿 → 201 + `NoticeView` |
| PUT | `/api/v1/notices/{id}` | `notice:notice:update` | 编辑 → `NoticeView` |
| DELETE | `/api/v1/notices/{id}` | `notice:notice:delete` | 删除（仅草稿）→ 204 |
| POST | `/api/v1/notices/{id}/publish` | `notice:notice:publish` | 发布（含 targets 参数）→ `NoticeView` |
| POST | `/api/v1/notices/{id}/revoke` | `notice:notice:publish` | 撤回 → `NoticeView` |
| POST | `/api/v1/notices/batch-publish` | `notice:notice:publish` | 批量发布 `{ ids: [...] }`（上限 100） |
| DELETE | `/api/v1/notices/batch` | `notice:notice:delete` | 批量删除 `{ ids: [...] }`（上限 100） |
| GET | `/api/v1/notices/export` | `notice:notice:export` | Excel 导出 → xlsx 流 |
| PUT | `/api/v1/notices/{id}/read` | 已登录即可 | 标记已读 → 204 |
| GET | `/api/v1/notices/unread-count` | 已登录即可 | 当前用户未读计数 → `{ count: number }` |
| POST | `/api/v1/wechat/bindMP` | 已登录即可 | 微信公众号绑定（传 code）→ 200 |
| POST | `/api/v1/wechat/bindMini` | 已登录即可 | 微信小程序绑定（传 code）→ 200 |
| DELETE | `/api/v1/wechat/unbind/{platform}` | 已登录即可 | 解绑微信（platform=MP/MINI）→ 204 |
| GET | `/api/v1/wechat/bindStatus` | 已登录即可 | 当前用户绑定状态 → `WechatBindStatusView` |

**批量操作约束**：`ids` 数组长度上限 100，超出返回 400。

### 3.5 DTO

```java
// 列表视图
public record NoticeView(Long id, String title, int status, boolean pinned,
    Instant startTime, Instant endTime, String createdByName,
    Instant createdAt, Instant updatedAt, boolean read) {}  // read: 当前用户是否已读

// 详情视图（含附件 + content + targets + version）
public record NoticeDetailView(Long id, String title, String content, int status,
    boolean pinned, Instant startTime, Instant endTime,
    List<AttachmentView> attachments, List<NoticeTargetView> targets,
    String createdByName, Instant createdAt, Instant updatedAt, int version) {}

// 通知目标视图
public record NoticeTargetView(String targetType, Long targetId, String targetName) {}

// 附件视图
public record AttachmentView(Long fileId, String fileName, Long fileSize, String url) {}

// 新增
public record NoticeCreateCommand(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 500000) String content,  // 富文本大小限制 500KB
    boolean pinned, Instant startTime, Instant endTime,
    List<Long> attachmentFileIds) {}

// 编辑
public record NoticeUpdateCommand(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 500000) String content,
    boolean pinned, Instant startTime, Instant endTime,
    List<Long> attachmentFileIds, @NotNull Integer version) {}

// 发布参数（含通知目标）
public record NoticePublishCommand(
    @NotEmpty List<NoticeTarget> targets) {}

public record NoticeTarget(
    @NotNull String targetType,  // ALL / DEPT / ROLE / USER
    Long targetId) {}            // ALL 时为 null

// 查询条件
public record NoticeQuery(Integer status, String keyword,
    Instant startTimeFrom, Instant startTimeTo,
    Integer page, Integer size, String sort) {}

// 微信绑定
public record WechatBindCommand(@NotBlank String code) {}

// 微信绑定状态
public record WechatBindStatusView(boolean mpBound, boolean miniBound,
    String mpNickname, String miniNickname) {}
```

**关键词搜索范围**：仅搜索 `title` 字段（`LIKE '%keyword%'`），不搜索 content（v1 规模足够，全文搜索推迟到 v1.5）。

### 3.6 富文本安全

**后端净化（jsoup）**：Service 层在保存 content 前使用 jsoup 净化 HTML。

```java
// NoticeService.java 中的 sanitize 方法
private static final Safelist SAFE_HTML = Safelist.relaxed()
    .addTags("div", "span", "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
             "ul", "ol", "li", "blockquote", "pre", "code", "table", "thead",
             "tbody", "tr", "th", "td", "img", "a", "strong", "em", "u", "s",
             "sub", "sup")
    .addAttributes("a", "href", "title", "target")
    .addAttributes("img", "src", "alt", "width", "height")
    .addAttributes("td", "colspan", "rowspan")
    .addAttributes("th", "colspan", "rowspan")
    .addAttributes(":all", "class", "style")
    .addProtocols("a", "href", "http", "https", "mailto")
    .addProtocols("img", "src", "http", "https");

private String sanitizeHtml(String html) {
    if (html == null) return null;
    return Jsoup.clean(html, SAFE_HTML);
}
```

**content 字段加校验**：`@Size(max = 500000)` 限制富文本大小。

### 3.7 附件安全

- **file_id 归属校验**：创建/编辑公告时，校验 `attachmentFileIds` 中的每个 file_id 确实属于当前租户且存在于 `platform-file`
- **SVG 排除**：附件上传时排除 SVG 文件类型（XSS 风险），在 `platform-file` 的上传接口配置白名单

### 3.8 12 步清单对标

| 步骤 | 内容 | Notice 对应 |
|------|------|------------|
| 1 | 目录结构 | `mb-business/business-notice/` |
| 2 | pom.xml | parent=mb-business, deps: mb-common, mb-schema, infra-security, infra-jooq, infra-exception, infra-sse, platform-oplog, platform-file, platform-notification, jsoup, fastexcel |
| 3 | Java 包 | `com.metabuild.business.notice.{api,domain,web,config}` |
| 4 | NoticeApi 接口 | api 包下，定义跨模块调用契约 |
| 5 | package-info.java | 声明允许的依赖（ArchUnit 强制） |
| 6 | Flyway DDL | `V20260615_001__notice.sql`（含 biz_notice + biz_notice_target + biz_notice_recipient + biz_notice_attachment 四张表） |
| 7 | mb-business/pom.xml 注册 | `<module>business-notice</module>` |
| 8 | mb-admin/pom.xml 依赖 | `<dependency>business-notice</dependency>` |
| 9 | jOOQ codegen | `mvn -Pcodegen generate-sources -pl mb-schema`（includes 模式已更新为 `(mb_\|biz_).*`） |
| 10 | Service + Repository + Controller | 见 §3.4/§3.5 |
| 10.1 | **DataScopeConfig 注册** | `registry.register("biz_notice", BIZ_NOTICE.OWNER_DEPT_ID)` |
| 10.2 | **DDL 含 owner_dept_id + 索引** | ✅ `idx_notice_tenant_dept` |
| 10.3 | **DataScope 写操作覆盖** | 修改/删除操作采用"先查后改"模式：先通过 DataScope 过滤查询记录是否存在，再执行写操作 |
| 11 | 集成测试 + ArchUnit | 见 §3.10 |
| 12 | 权限点注册 | 7 个权限码 `notice:notice:*`（list/detail/create/update/delete/publish/export） |

### 3.9 Excel 导出（FastExcel）

使用 **FastExcel**（`cn.idev.excel:fastexcel`，EasyExcel 社区分支，API 兼容，维护更活跃）：
- `GET /notices/export` + 同列表筛选参数
- Service 分页查询（每页 1000 条）→ FastExcel 流式写入 → `StreamingResponseBody`
- **行数上限**：10 万行，超出截断并在最后一行提示"数据量过大，请缩小筛选范围"
- **超时配置**：导出请求 timeout 设为 5 分钟（独立配置，不影响其他接口）
- **CSV Formula 注入防护**：实现 `CellWriteHandler`，对以 `=`、`+`、`-`、`@`、`\t`、`\r` 开头的字符串值前缀 `'`（单引号转义）

### 3.10 集成测试

| 用例 | 验证 |
|------|------|
| 创建草稿 | 201 + 字段正确 |
| 编辑草稿 | 200 + 字段更新 |
| 发布（含 targets） | 状态 0→1 + recipient 展开 + 通知分发触发 |
| 撤回 | 状态 1→2 |
| 重新发布 | 状态 2→1 |
| 删除草稿 | 204 |
| 删除非草稿 | 400 |
| 批量发布 | 多条状态更新（上限 100 校验） |
| 批量删除 | 仅删除草稿，非草稿跳过（上限 100 校验） |
| 分页 + 筛选 + 排序 | PageResult 结构正确 |
| 带附件创建 | 附件关联正确 |
| 附件 file_id 不存在 | 400 |
| 附件 file_id 不属于当前租户 | 400 |
| 乐观锁冲突 | 409 |
| 权限不足 | 403 |
| **数据权限隔离** | 不同部门用户只看到本部门公告 |
| 导出 | 200 + Content-Type xlsx |
| **标记已读** | read_at 从 NULL 变为当前时间 |
| **重复标记已读** | 幂等，204 |
| **未读计数** | 返回正确计数 |
| **keyword 搜索** | 仅匹配 title，不匹配 content |
| **content XSS 净化** | 提交含 script 标签的 HTML，保存后 script 被移除 |

---

## 4. SSE 基础设施

### 4.1 定位

`server/mb-infra/infra-sse/` — **业务无关**的实时消息管道。

职责：
- SSE 连接管理（建连/断连/心跳）
- 认证：走标准 HTTP Authorization header（和 api-sdk 一致，无需额外认证方案）
- 在线用户感知（谁在线）
- 消息推送（单播/广播）

**不**负责：具体业务消息的构造和触发（那是 business/platform 层的事）。

**为什么 SSE 而非 WebSocket**（ADR-0013）：
- SSE 基于 HTTP，认证与现有 api-sdk 完全一致（Authorization header），无需 STOMP 握手认证
- `SseEmitter` 是 Spring MVC 原生能力，零额外依赖
- 前端 `@microsoft/fetch-event-source`（3KB gzipped）比 SockJS + STOMP 组合轻量得多
- v1 的实时需求是单向推送（服务端→客户端），SSE 完美匹配
- 如果未来需要双向通信，再升级 WebSocket（v1.5+）

### 4.2 后端设计

```
infra-sse/
├── SseAutoConfiguration.java       # 自动配置
├── SseConnectionController.java    # GET /api/v1/sse/connect（建连端点）
├── SseSessionRegistry.java         # 在线用户 session 管理（ConcurrentHashMap）
├── SseMessageSender.java           # 发送消息的统一接口
└── SseMessageSenderImpl.java       # 接口实现
```

**建连端点**：
```java
@RestController
@RequestMapping("/api/v1/sse")
public class SseConnectionController {

    private final SseSessionRegistry registry;

    @GetMapping("/connect")
    public SseEmitter connect(@CurrentUser Long userId) {
        // 超时设为 0（永不超时，由心跳保活）
        SseEmitter emitter = new SseEmitter(0L);
        registry.register(userId, emitter);

        emitter.onCompletion(() -> registry.remove(userId, emitter));
        emitter.onTimeout(() -> registry.remove(userId, emitter));
        emitter.onError(e -> registry.remove(userId, emitter));

        return emitter;
    }
}
```

**Session 管理**：
```java
@Component
public class SseSessionRegistry {
    // v1 单实例：ConcurrentHashMap 足够
    // v1.5 多实例：升级为 Redis Pub/Sub
    private final ConcurrentHashMap<Long, SseEmitter> sessions = new ConcurrentHashMap<>();

    public void register(Long userId, SseEmitter emitter) {
        // 旧连接先关闭（单用户单连接）
        SseEmitter old = sessions.put(userId, emitter);
        if (old != null) {
            old.complete();
        }
    }

    public void remove(Long userId, SseEmitter emitter) {
        sessions.remove(userId, emitter);
    }

    public Set<Long> getOnlineUserIds() {
        return Collections.unmodifiableSet(sessions.keySet());
    }
}
```

**`SseMessageSender`**（infra 层对外接口）：
```java
public interface SseMessageSender {
    /** 发送给指定用户 */
    void sendToUser(Long userId, String event, Object payload);
    /** 全局广播 */
    void broadcast(String event, Object payload);
    /** 踢人下线（发送强制登出消息 + 关闭连接） */
    void forceLogout(Long userId, String reason);
    /** 获取在线用户 ID 集合 */
    Set<Long> getOnlineUserIds();
}
```

**实现**：
```java
@Service
@RequiredArgsConstructor
public class SseMessageSenderImpl implements SseMessageSender {
    private final SseSessionRegistry registry;
    private final ObjectMapper objectMapper;

    @Override
    public void sendToUser(Long userId, String event, Object payload) {
        SseEmitter emitter = registry.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .name(event)
                    .data(objectMapper.writeValueAsString(payload)));
            } catch (IOException e) {
                registry.remove(userId, emitter);
            }
        }
    }

    @Override
    public void broadcast(String event, Object payload) {
        registry.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                    .name(event)
                    .data(objectMapper.writeValueAsString(payload)));
            } catch (IOException e) {
                registry.remove(userId, emitter);
            }
        });
    }

    @Override
    public void forceLogout(Long userId, String reason) {
        sendToUser(userId, "force-logout", Map.of("reason", reason));
        // 发送后关闭连接
        SseEmitter emitter = registry.get(userId);
        if (emitter != null) {
            emitter.complete();
            registry.remove(userId, emitter);
        }
    }

    @Override
    public Set<Long> getOnlineUserIds() {
        return registry.getOnlineUserIds();
    }
}
```

**心跳**：服务端每 30s 发送 `:heartbeat` 注释行（SSE 规范中 `:` 开头为注释，客户端忽略但可保活连接）：
```java
@Scheduled(fixedRate = 30_000)
public void heartbeat() {
    registry.forEach((userId, emitter) -> {
        try {
            emitter.send(SseEmitter.event().comment("heartbeat"));
        } catch (IOException e) {
            registry.remove(userId, emitter);
        }
    });
}
```

### 4.3 前端设计

L4 `@mb/app-shell` 新增 `sse/` 子模块：

```
packages/app-shell/src/sse/
├── use-sse-connection.ts    # useSseConnection() — 自动连接/断连/重连
├── use-sse-subscription.ts  # useSseSubscription(event, handler) — 订阅消息
├── sse-client.ts            # EventSource 封装（基于 @microsoft/fetch-event-source）
├── types.ts                 # SseMessage 类型定义
└── index.ts
```

**`useSseConnection()`**：
```typescript
import { fetchEventSource } from '@microsoft/fetch-event-source';

export function useSseConnection() {
  const { token, isAuthenticated } = useAuth();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetchEventSource('/api/v1/sse/connect', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: ctrl.signal,
      onmessage(ev) {
        // 分发到订阅者（通过 EventEmitter 或 React context）
        sseEventBus.emit(ev.event, JSON.parse(ev.data));
      },
      onclose() {
        // 服务端关闭 → 自动重连（fetch-event-source 内置）
      },
      onerror(err) {
        // 指数退避 + jitter 重连（fetch-event-source 内置 retry）
        // 如果是 401 → 不重连，触发登出
        if (err instanceof Response && err.status === 401) {
          ctrl.abort();
          logout();
          throw err; // 停止重连
        }
      },
    });

    return () => ctrl.abort();
  }, [isAuthenticated, token]);
}
```

**SSE token 过期联动**：用户登出时（手动或 token 过期），`useSseConnection` 的 cleanup 函数 `ctrl.abort()` 自动关闭 SSE 连接。token refresh 成功后，React 状态变化触发 effect 重新建连。

**`useSseSubscription(event, handler)`**：
```typescript
export function useSseSubscription(event: string, handler: (data: unknown) => void) {
  useEffect(() => {
    sseEventBus.on(event, handler);
    return () => sseEventBus.off(event, handler);
  }, [event, handler]);
}
```

**重连策略**：`@microsoft/fetch-event-source` 内置 retry 机制，默认指数退避。额外配置 jitter（随机延迟 0-1s），避免大量客户端同时重连造成服务端压力。

### 4.4 实时能力

| 能力 | 触发 | SSE 事件 | 前端处理 |
|------|------|---------|---------|
| **踢人下线** | admin 在用户管理页点"强制下线" | `forceLogout(userId, reason)` → event: `force-logout` | 清 token + toast "您已被管理员下线" + 跳登录 |
| **权限变更** | admin 修改角色权限 | `sendToUser(userId, 'permission-changed', {})` | `invalidateQueries(['auth', 'me'])` 刷新权限缓存 |
| **公告发布** | notice 发布 → NotificationDispatcher | `broadcast('notice-published', { id, title })` → 全员 | toast "新公告：xxx" + 刷新列表 |
| **系统广播** | admin 发送维护通知 | `broadcast('system-broadcast', { message })` | 全局 alert banner |

---

## 5. 通知渠道系统（platform-notification 升级）

### 5.1 渠道抽象

```java
// 渠道接口（Strategy Pattern）
public interface NotificationChannel {
    String channelType();  // "IN_APP" / "EMAIL" / "WECHAT_MP" / "WECHAT_MINI"
    void send(NotificationMessage message) throws NotificationException;
    boolean supports(NotificationMessage message);
}

// 通知消息（渠道无关）
public record NotificationMessage(
    Long tenantId,
    List<Long> recipientUserIds,  // 目标用户
    String templateCode,           // 模板编码
    Map<String, String> params,    // 模板参数 {{title}}, {{content}} 等
    String module,                 // 来源模块（notice/order/...）
    String referenceId             // 关联业务 ID
) {}
```

### 5.2 四个渠道实现

**1. 站内信 + SSE 推送（InAppChannel）**
- 批量写入 `biz_notice_recipient` 表（`batchInsert`，非逐条 insert）
- 同时通过 `SseMessageSender.sendToUser()` 对在线用户实时推送
- 前端 toast + 未读数更新（`invalidateQueries(['notices', 'unread-count'])`）

**2. 邮件（EmailChannel）**
- Spring Boot `JavaMailSender` + Thymeleaf 模板
- SMTP 配置：通过环境变量注入（`MB_MAIL_HOST`、`MB_MAIL_PORT`、`MB_MAIL_USERNAME`、`MB_MAIL_PASSWORD`）
- 用户邮箱从 `mb_iam_user.email` 字段取

**3. 微信公众号模板消息（WeChatMpChannel）**
- 调用微信 API：`POST https://api.weixin.qq.com/cgi-bin/message/template/send`
- 需要：`appId` + `appSecret`（通过环境变量，见 §5.4）
- 需要：用户 openid 从 `mb_user_wechat_binding` 表查（platform=MP）
- 模板消息格式：`{ touser, template_id, url, data: { first, keyword1, ... } }`
- 未绑定的用户静默跳过（不报错）

**4. 微信小程序订阅消息（WeChatMiniChannel）**
- 调用微信 API：`POST https://api.weixin.qq.com/cgi-bin/message/subscribe/send`
- 需要：小程序 `appId` + `appSecret`（通过环境变量）
- 需要：用户 openid 从 `mb_user_wechat_binding` 表查（platform=MINI）
- 用户需主动订阅（一次性订阅 or 长期订阅）
- 未绑定的用户静默跳过

### 5.3 微信绑定

**`V20260615_002__wechat_binding.sql`**：
```sql
CREATE TABLE mb_user_wechat_binding (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    user_id         BIGINT NOT NULL,
    platform        VARCHAR(20) NOT NULL,   -- 'MP' (公众号) / 'MINI' (小程序)
    app_id          VARCHAR(64) NOT NULL,
    open_id         VARCHAR(64) NOT NULL,
    union_id        VARCHAR(64),            -- 同一开放平台下多应用关联
    nickname        VARCHAR(100),
    avatar_url      VARCHAR(500),
    bound_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id, platform, app_id)
);

CREATE INDEX idx_wechat_binding_user ON mb_user_wechat_binding (tenant_id, user_id);
CREATE INDEX idx_wechat_binding_openid ON mb_user_wechat_binding (app_id, open_id);

COMMENT ON TABLE mb_user_wechat_binding IS '微信绑定关系';
COMMENT ON COLUMN mb_user_wechat_binding.platform IS '平台类型：MP=公众号 MINI=小程序';
COMMENT ON COLUMN mb_user_wechat_binding.open_id IS '微信 OpenID（同一用户在不同应用有不同 OpenID）';
COMMENT ON COLUMN mb_user_wechat_binding.union_id IS 'UnionID（同一开放平台下多应用共享）';
```

**绑定流程**：

**公众号绑定（OAuth 网页授权）**：
1. 前端引导用户访问微信授权页：`https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_userinfo&state=STATE`
2. 用户授权后微信回调带 `code`
3. 前端将 `code` 发送到 `POST /api/v1/wechat/bindMP`
4. 后端用 `code` 换 `access_token` + `openid`：`GET https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=APPSECRET&code=CODE&grant_type=authorization_code`
5. 后端获取用户信息（nickname/avatar）：`GET https://api.weixin.qq.com/sns/userinfo?access_token=TOKEN&openid=OPENID&lang=zh_CN`
6. 写入 `mb_user_wechat_binding` 表

**小程序绑定（wx.login）**：
1. 小程序端调用 `wx.login()` 获取 `code`
2. 发送 `code` 到 `POST /api/v1/wechat/bindMini`
3. 后端用 `code` 换 `openid` + `session_key`：`GET https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=APPSECRET&js_code=CODE&grant_type=authorization_code`
4. 写入 `mb_user_wechat_binding` 表

**开发环境**：使用微信测试号 + ngrok 内网穿透（回调域名指向本地 ngrok 地址）。

### 5.4 敏感配置（环境变量）

微信 appId/appSecret、SMTP 密码等敏感配置通过环境变量注入，和 `MB_SA_TOKEN_JWT_SECRET` 同级，**不存 platform-config 表**。

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `MB_WECHAT_MP_APP_ID` | 公众号 AppID | （空） |
| `MB_WECHAT_MP_APP_SECRET` | 公众号 AppSecret | （空） |
| `MB_WECHAT_MP_TEMPLATE_NOTICE` | 公告通知模板 ID | （空） |
| `MB_WECHAT_MINI_APP_ID` | 小程序 AppID | （空） |
| `MB_WECHAT_MINI_APP_SECRET` | 小程序 AppSecret | （空） |
| `MB_WECHAT_MINI_TEMPLATE_NOTICE` | 公告订阅消息模板 ID | （空） |
| `MB_MAIL_HOST` | SMTP 服务器 | （空） |
| `MB_MAIL_PORT` | SMTP 端口 | 587 |
| `MB_MAIL_USERNAME` | SMTP 用户名 | （空） |
| `MB_MAIL_PASSWORD` | SMTP 密码 | （空） |

**代码层面做好空值检查** — 环境变量未配置的渠道跳过不报错（`supports()` 方法返回 false）。

`application.yml` 映射示例：
```yaml
mb:
  wechat:
    mp:
      app-id: ${MB_WECHAT_MP_APP_ID:}
      app-secret: ${MB_WECHAT_MP_APP_SECRET:}
      template-notice: ${MB_WECHAT_MP_TEMPLATE_NOTICE:}
    mini:
      app-id: ${MB_WECHAT_MINI_APP_ID:}
      app-secret: ${MB_WECHAT_MINI_APP_SECRET:}
      template-notice: ${MB_WECHAT_MINI_TEMPLATE_NOTICE:}
spring:
  mail:
    host: ${MB_MAIL_HOST:}
    port: ${MB_MAIL_PORT:587}
    username: ${MB_MAIL_USERNAME:}
    password: ${MB_MAIL_PASSWORD:}
```

### 5.5 通知分发器

```java
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {
    private final List<NotificationChannel> channels;  // Spring 自动注入全部实现
    private final NotificationLogRepository logRepo;

    /**
     * 渠道并行执行：每个 channel 一个 CompletableFuture
     * 单渠道失败不影响其他渠道（吞异常 + 记录日志）
     */
    public void dispatch(NotificationMessage message) {
        List<CompletableFuture<Void>> futures = channels.stream()
            .filter(ch -> ch.supports(message))
            .map(ch -> CompletableFuture.runAsync(() -> {
                try {
                    ch.send(message);
                    logRepo.logSuccess(message, ch.channelType());
                } catch (NotificationException e) {
                    logRepo.logFailure(message, ch.channelType(), e.getMessage());
                    // 不抛出 — 单渠道失败不影响其他渠道
                }
            }))
            .toList();

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }
}
```

### 5.6 发送记录

**`V20260615_003__notification_log.sql`**：
```sql
CREATE TABLE mb_notification_log (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    channel_type    VARCHAR(20) NOT NULL,    -- IN_APP / EMAIL / WECHAT_MP / WECHAT_MINI
    recipient_id    BIGINT NOT NULL,
    template_code   VARCHAR(100),
    module          VARCHAR(50),
    reference_id    VARCHAR(100),
    status          SMALLINT NOT NULL,       -- 0=pending 1=success 2=failed
    error_message   TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_log_recipient ON mb_notification_log (tenant_id, recipient_id, created_at DESC);
CREATE INDEX idx_notif_log_status ON mb_notification_log (tenant_id, status);

COMMENT ON TABLE mb_notification_log IS '通知发送记录';
COMMENT ON COLUMN mb_notification_log.channel_type IS '渠道类型：IN_APP/EMAIL/WECHAT_MP/WECHAT_MINI';
COMMENT ON COLUMN mb_notification_log.status IS '状态：0=pending 1=success 2=failed';
```

### 5.7 Notice → 通知串联

```
NoticeService.publish(id, targets)
  → update status = PUBLISHED
  → 写入 biz_notice_target（多态目标）
  → 展开 targets → 具体 userIds（ALL=全员，DEPT=部门下所有用户，ROLE=角色下所有用户，USER=直接）
  → batchInsert 到 biz_notice_recipient
  → applicationEventPublisher.publishEvent(new NoticePublishedEvent(notice, recipientUserIds))
```

```
@Component
public class NoticePublishedEventListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onNoticePublished(NoticePublishedEvent event) {
        notificationDispatcher.dispatch(NotificationMessage{
            recipientUserIds: event.recipientUserIds(),
            templateCode: "notice_published",
            params: { title: event.notice().title() },
            module: "notice",
            referenceId: String.valueOf(event.notice().id())
        });
    }
}
```

### 5.8 分发执行模型

关键设计：**通知分发必须在事务提交后异步执行**。

1. **AFTER_COMMIT**：`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` 确保主事务（写 notice + target + recipient）成功后才触发分发，避免事务回滚但通知已发出
2. **@Async**：分发逻辑异步执行，不阻塞主请求返回。用户调 `POST /notices/{id}/publish` 后立即得到响应，分发在后台进行
3. **渠道并行**：`NotificationDispatcher` 内部用 `CompletableFuture.allOf()` 并行执行所有支持的渠道，避免串行等待（例如邮件 SMTP 延迟不影响站内信推送）
4. **容错**：单个渠道失败（如微信 API 超时）不影响其他渠道，失败记录写入 `mb_notification_log`

---

## 6. 前端设计

### 6.1 新增路由

```
routes/_authed/
├── notices/
│   ├── index.tsx          # /notices — 列表页
│   └── $id.tsx            # /notices/$id — 详情页
```

### 6.2 i18n

`apps/web-admin/src/i18n/zh-CN/notice.json`：

```json
{
  "title": "通知公告",
  "list": { "title": "公告列表", "empty": "暂无公告", "export": "导出 Excel" },
  "form": { "title": "公告标题", "content": "公告内容", "pinned": "置顶", "startTime": "生效时间", "endTime": "失效时间", "attachments": "附件", "targets": "通知范围" },
  "status": { "draft": "草稿", "published": "已发布", "revoked": "已撤回" },
  "action": { "create": "新增公告", "edit": "编辑", "delete": "删除", "publish": "发布", "revoke": "撤回", "markRead": "标为已读" },
  "confirm": { "delete": "确定删除此公告？", "publish": "确定发布此公告？", "revoke": "确定撤回此公告？" },
  "filter": { "status": "状态", "keyword": "关键词", "dateRange": "日期范围" },
  "batch": { "selected": "已选择 {count} 项", "delete": "批量删除", "publish": "批量发布" },
  "read": { "unread": "未读", "read": "已读", "unreadCount": "{count} 条未读" },
  "target": { "all": "全员", "dept": "按部门", "role": "按角色", "user": "指定用户" },
  "wechat": { "bindMP": "绑定公众号", "bindMini": "绑定小程序", "unbind": "解绑", "bound": "已绑定", "unbound": "未绑定" }
}
```

对应 `en-US/notice.json`。

**i18next.d.ts 更新**：新增 notice namespace 声明，确保类型推导覆盖新增的 key。

### 6.3 列表页

- `NxFilter`：状态 + 关键词 + 日期范围
- `NxTable`：标题（link 到详情，**未读加粗/已读正常**）、状态 Badge、置顶图标、生效时间、创建人、操作列
- `NxBar`：批量删除 + 批量发布
- 操作列：根据状态+权限动态显示（编辑/发布/撤回/删除/详情）
- 导出按钮（受 `notice:notice:export` 权限控制）
- **未读标记**：列表项根据 `read` 字段显示未读/已读样式

**TanStack Query hooks（orval 生成）使用示例**：
```tsx
import { useGetNotices, usePublishNotice } from '@mb/api-sdk';

function NoticeListPage() {
  const { data, isLoading } = useGetNotices({ status: 1, page: 1, size: 20 });
  const publishMutation = usePublishNotice();

  // orval 自动生成 query key factory，invalidation 简洁
  const handlePublish = (id: number) => {
    publishMutation.mutate({ id, data: { targets: [{ targetType: 'ALL' }] } });
  };
}
```

### 6.4 新增/编辑（NxDrawer + NxForm）

- Zod schema 验证（title 必填 max 200，content max 500000）
- 富文本编辑：**TipTap**（`@tiptap/react` + `@tiptap/starter-kit` + image extension）
- **TipTapField 包装组件**：L5 层创建 `TipTapField` 组件，使用 `useController` 桥接 React Hook Form 和 TipTap。因为 TipTap 的数据模型（ProseMirror doc）与 RHF 的 string 值不直接兼容，需要包装层负责 HTML ↔ Editor 双向同步：
  ```tsx
  // features/notice/components/TipTapField.tsx
  function TipTapField({ name, control }: { name: string; control: Control }) {
    const { field } = useController({ name, control });
    const editor = useEditor({
      extensions: [StarterKit, Image],
      content: field.value,
      onUpdate: ({ editor }) => {
        field.onChange(editor.getHTML());
      },
    });
    return <EditorContent editor={editor} />;
  }
  ```
- **通知范围选择器**：发布时弹出 target 选择（全员/部门树/角色列表/用户搜索）
- **附件上传**：L5 自建 `FileUploadField` 组件，调 platform-file API 上传，获取 fileId 列表。组件封装文件选择、上传进度、已上传列表、删除等交互
- 脏检查：修改后关闭 Drawer 弹确认

### 6.5 详情页

- 富文本渲染：`dangerouslySetInnerHTML` + **DOMPurify** 净化
- **DOMPurify 配置白名单**明确列出（与后端 jsoup Safelist 对齐）：
  ```typescript
  import DOMPurify from 'dompurify';

  const ALLOWED_TAGS = [
    'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'thead',
    'tbody', 'tr', 'th', 'td', 'img', 'a', 'strong', 'em', 'u', 's',
    'sub', 'sup',
  ];
  const ALLOWED_ATTR = ['href', 'title', 'target', 'src', 'alt', 'width',
    'height', 'colspan', 'rowspan', 'class', 'style'];

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
  ```
- 附件下载列表
- 状态操作按钮（发布/撤回/编辑/删除）
- **进入详情页自动标记已读**：`useEffect` 中调 `PUT /notices/{id}/read`
- 返回列表

### 6.6 未读计数 Badge

在 L4 app-shell 的头部导航区域显示未读公告计数：

```tsx
// app-shell header 区域
function NotificationBadge() {
  const { data } = useGetNoticesUnreadCount();
  if (!data?.count) return null;
  return <Badge count={data.count} />;
}
```

SSE 推送 `notice-published` 事件时自动 `invalidateQueries` 刷新未读计数。

### 6.7 SSE 集成

```tsx
// 在 _authed layout 中
useSseConnection();  // 登录后自动建连

useSseSubscription('force-logout', (msg: { reason: string }) => {
  toast.error(`您已被管理员下线：${msg.reason}`);
  logout();
});

useSseSubscription('notice-published', (msg: { id: number; title: string }) => {
  toast.info(`新公告：${msg.title}`);
  queryClient.invalidateQueries({ queryKey: getNoticesQueryKey() });
  queryClient.invalidateQueries({ queryKey: getNoticesUnreadCountQueryKey() });
});

useSseSubscription('permission-changed', () => {
  queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
});

useSseSubscription('system-broadcast', (msg: { message: string }) => {
  // 全局 alert banner
  showSystemBanner(msg.message);
});
```

### 6.8 微信绑定页

web-admin 设置页中新增微信绑定入口：

```
routes/_authed/
├── settings/
│   ├── index.tsx          # 设置页
│   └── wechat-bind.tsx    # 微信绑定（公众号 + 小程序）
```

- 展示当前绑定状态（已绑定显示昵称 + 解绑按钮，未绑定显示绑定按钮）
- 公众号绑定：点击后引导到微信授权页，授权完成后回调传 code
- 小程序绑定：仅在小程序 WebView 环境下显示

### 6.9 权限守卫

```tsx
// 路由级
beforeLoad: requireAuth({ permission: 'notice:notice:list' })

// 按钮级
{user.hasPermission('notice:notice:create') && <Button>新增</Button>}
{user.hasPermission('notice:notice:publish') && status === 0 && <Button>发布</Button>}
```

### 6.10 E2E 测试（Playwright）

| 场景 | 步骤 |
|------|------|
| 新增草稿 | 登录→列表→新增→填写→保存→出现 |
| 编辑 | 编辑→修改→保存→更新 |
| 发布（含目标选择） | 发布→选择范围→确认→状态变更 |
| 撤回 | 撤回→确认→状态变更 |
| 删除草稿 | 删除→确认→消失 |
| 批量发布 | 勾选→批量发布→全部更新 |
| 导出 | 导出→下载 xlsx |
| 权限控制 | 无 publish 权限看不到发布按钮 |
| 详情页 | 点标题→详情→内容+附件 |
| 数据权限隔离 | 不同部门用户只看到本部门公告 |
| **已读标记** | 进入详情→返回列表→已读样式 |
| **未读计数** | 发布公告→其他用户看到 badge 计数 |
| **SSE 推送** | 发布公告→其他登录用户收到 toast |

---

## 7. 新增依赖

### 后端

| 依赖 | 版本 | 用途 |
|------|------|------|
| `springdoc-openapi-starter-webmvc-api` | 2.8.0 | OpenAPI 生成 |
| `cn.idev.excel:fastexcel` | latest stable | Excel 导出（流式写入低内存，EasyExcel 社区分支） |
| `org.jsoup:jsoup` | 1.18.+ | 富文本 HTML 净化 |
| `spring-boot-starter-mail` | 随 Boot | 邮件发送 |
| `spring-boot-starter-thymeleaf` | 随 Boot | 邮件 HTML 模板 |
| `weixin-java-mp` (WxJava) | 4.6.+ | 微信公众号 API |
| `weixin-java-miniapp` (WxJava) | 4.6.+ | 微信小程序 API |

**已移除**（相比 v1/v2）：
- ~~`spring-boot-starter-websocket`~~ → 改用 SSE（`SseEmitter` 零额外依赖）
- ~~`com.alibaba:easyexcel`~~ → 改用 `cn.idev.excel:fastexcel`

WxJava 是 Java 生态最成熟的微信 SDK（GitHub 30k+ stars，支持公众号/小程序/企业微信，Spring Boot starter 开箱即用）。

### 前端

| 依赖 | 包 | 用途 |
|------|-----|------|
| `orval` | 根 devDep | OpenAPI → TanStack Query hooks + MSW mock 生成 |
| `@tiptap/react` + `@tiptap/starter-kit` + extensions | web-admin | 富文本编辑 |
| `dompurify` + `@types/dompurify` | web-admin | HTML 净化 |
| `@microsoft/fetch-event-source` | app-shell | SSE 客户端（3KB gzipped） |

**已移除**（相比 v1/v2）：
- ~~`@openapitools/openapi-generator-cli`~~ → 改用 `orval`
- ~~`sockjs-client` + `@stomp/stompjs`~~ → 改用 `@microsoft/fetch-event-source`

---

## 8. 开发顺序

```
Phase 1: OpenAPI 管线（orval）
  ├── 后端 springdoc 配置
  ├── openapi.json 首次生成并提交
  ├── 前端 orval 配置（orval.config.ts + custom-instance.ts）
  ├── 首次 pnpm generate:api-sdk 验证
  ├── api-sdk/types/ 保留 AppPermission + PageResult<T>
  ├── api-sdk/index.ts 统一导出 generated + types
  └── 验证：check:types 通过 + MSW mock 可用

Phase 2: Notice 后端
  ├── DDL + jOOQ codegen（includes 更新为 (mb_|biz_).*）
  ├── Repository + Service（含 jsoup 净化 + DataScope 注册）
  ├── Controller（含已读/未读端点 + 批量操作上限校验）
  ├── 附件集成（platform-file，含 file_id 归属校验 + SVG 排除）
  ├── @OperationLog 集成
  ├── Excel 导出（FastExcel + CellWriteHandler 防注入 + 10 万行上限）
  ├── package-info.java + ArchUnit
  └── 集成测试（23 用例）

Phase 3: SSE 基础设施
  ├── 后端 infra-sse（SseEmitter + SseSessionRegistry + SseMessageSender + 心跳）
  ├── 前端 L4 sse 子模块（useSseConnection + useSseSubscription + sseEventBus）
  └── 验证：建连 + 心跳 + 认证 + 消息收发 + 断线重连

Phase 4: 通知渠道系统
  ├── 渠道抽象（NotificationChannel 接口 + NotificationDispatcher）
  ├── 分发执行模型（AFTER_COMMIT + @Async + CompletableFuture.allOf）
  ├── InAppChannel（batchInsert recipient + SSE 推送）
  ├── EmailChannel（JavaMailSender + Thymeleaf）
  ├── WeChatMpChannel（WxJava 公众号模板消息）
  ├── WeChatMiniChannel（WxJava 小程序订阅消息）
  ├── 微信绑定表 + 绑定/解绑 API（含公众号 OAuth 流程 + 小程序 wx.login 流程）
  ├── 发送记录表 + 查询 API
  ├── 环境变量配置（application.yml 映射）
  └── Notice publish → AFTER_COMMIT → NotificationDispatcher 串联

Phase 5: Notice 前端 + 重新生成 SDK
  ├── ★ 重新生成 api-sdk（Phase 2-4 新增了后端端点）
  ├── 路由 + 权限声明
  ├── i18n 字典（zh-CN + en-US notice namespace + i18next.d.ts 更新）
  ├── 列表页（NxTable + NxFilter + NxBar + 导出 + 未读标记）
  ├── 新增/编辑（NxDrawer + NxForm + TipTapField + FileUploadField + 目标选择器）
  ├── 详情页（富文本渲染 + DOMPurify + 附件下载 + 状态操作 + 自动标记已读）
  ├── 未读计数 Badge（头部导航）
  ├── 微信绑定页（设置页入口）
  └── SSE 集成（公告推送 toast + 踢人下线 + 权限刷新 + 系统广播）

Phase 6: 实时能力 + E2E + CI
  ├── 踢人下线（admin UI + 后端 API + SSE 推送 + 前端处理）
  ├── 权限变更推送
  ├── 系统广播
  ├── CI 更新（client job 增加 generate 步骤 + drift 检测）
  ├── dep-cruiser 规则确认（orval generated 路径）
  ├── Playwright E2E 测试（13 场景）
  └── 全量质量门禁
```

---

## 9. 质量标准（ADR-0006 P0 对标）

| P0 维度 | 满足方式 |
|---------|---------|
| P0.1 12 步清单 | 严格逐步执行，每步有 commit |
| P0.2 HikariCP | 复用 M4 配置 |
| P0.3 缓存 | 详情缓存 `mb:notice:detail:{id}`，mutation evict；未读计数缓存 `mb:notice:unread:{userId}` |
| P0.4 定时任务 | 可选：到期自动下架（@Scheduled + ShedLock） |
| P0.5 文件存储 | 附件通过 platform-file（含归属校验 + SVG 排除） |
| P0.6 操作日志 | @OperationLog 全覆盖 |
