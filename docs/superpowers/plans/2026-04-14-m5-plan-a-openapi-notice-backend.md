# M5 Plan A: OpenAPI 管线 + Notice 后端 实施计划

> **说明**：这是历史执行计划，不是当前真相。计划中的接口、测试数量、实现步骤和代码片段必须以当前仓库实际文件重新校验。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 OpenAPI 契约管线（orval），实现 notice 通知公告后端模块（CRUD + 状态机 + 附件 + 导出 + 发布 + 已读），作为第一个 canonical reference 业务模块。

**Architecture:**
- Phase 0: 写 ADR-0014 记录 SSE 替代 WebSocket 的决策
- Phase 1: springdoc → openapi.json → orval → TanStack Query hooks + 类型，mutator 薄包装委托 HttpClient
- Phase 2: business-notice 模块遵循 12 步清单，DDL + jOOQ codegen + Repository + Service + Controller + 集成测试

**Tech Stack:** Spring Boot 3.5 + jOOQ + springdoc 2.6 + orval 8.7 + FastExcel + jsoup

**Spec:** `docs/superpowers/specs/2026-04-14-m5-notice-module-design.md`（设计细节参考此文件）

---

## Phase 0: ADR

### Task 1: ADR-0014 + CLAUDE.md 更新 + 后端 specs 引用更新

**Files:**
- `docs/adr/0014-sse-替代-websocket-实时推送.md`（新建）
- `CLAUDE.md`（更新 ADR 索引表）
- `docs/specs/backend/README.md`（新增 ADR-0014 引用，如有 WebSocket 相关段落更新指向）

**Steps:**

- [ ] 创建 `docs/adr/0014-sse-替代-websocket-实时推送.md`，内容如下：

```markdown
# ADR-0014: SSE 替代 WebSocket 作为 v1 实时推送方案

## 状态

已采纳（2026-04-14）

## 背景

v1 需要实时推送能力（踢人下线、权限变更推送、公告发布通知、系统广播）。M1 脚手架预留了 `infra-websocket` 空壳模块。原计划 v1.5 实施 WebSocket + STOMP。

在 M5 设计 Notice 模块时重新评估：v1 的实时需求全部是**服务端→客户端单向推送**，不需要双向通信。

## 决策

**v1 使用 SSE（Server-Sent Events）替代 WebSocket + STOMP**，在 `infra-sse` 新模块中实现。`infra-websocket` 空壳保留，v1.5 按需启用。

## 理由

| 维度 | SSE | WebSocket + STOMP |
|------|-----|-------------------|
| 认证 | 标准 HTTP Authorization header，与 api-sdk 完全一致 | 需要 STOMP 握手认证，额外实现 |
| 依赖 | `SseEmitter`（Spring MVC 原生），零额外依赖 | spring-boot-starter-websocket + SockJS + STOMP |
| 前端体积 | `@microsoft/fetch-event-source`（3KB gzipped） | SockJS client + @stomp/stompjs（~30KB） |
| 通信模式 | 服务端→客户端单向（v1 完全匹配） | 双向通信（v1 不需要） |
| 部署 | 标准 HTTP，Nginx/CDN 天然支持 | 需要 Nginx WebSocket 代理配置 |
| 多实例扩展 | v1.5 升级为 Redis Pub/Sub 广播 | 同样需要 Redis/消息队列 |

## 后果

- `infra-sse` 模块新增：连接管理、心跳、单播/广播、踢人下线
- 前端 `@mb/app-shell/sse` 子模块：`useSseConnection()` + `useSseSubscription()`
- `infra-websocket` 空壳不删除，v1.5 如需双向通信再启用
- v1 的四个实时能力（踢人下线/权限变更/公告发布/系统广播）全部通过 SSE 实现
```

- [ ] 更新 `CLAUDE.md` 的 ADR 索引表，新增一行：

```
| [0014](docs/adr/0014-sse-替代-websocket-实时推送.md) | **SSE 替代 WebSocket 作为 v1 实时推送方案** | 已采纳 |
```

- [ ] 检查 `docs/specs/backend/README.md` 中 WebSocket 相关段落，在适当位置补充 ADR-0014 引用说明（"v1 用 SSE，见 ADR-0014"）

**Verify:**

```bash
# ADR 文件存在
test -f docs/adr/0014-sse-替代-websocket-实时推送.md && echo "OK"
# CLAUDE.md 包含 0014
grep "0014" CLAUDE.md && echo "OK"
```

**Commit:** `docs: ADR-0014 SSE 替代 WebSocket 实时推送`

---

## Phase 1: OpenAPI 管线

### Task 2: HttpClient blob 支持

**Files:**
- `client/packages/api-sdk/src/http-client.ts`（修改）
- `client/packages/api-sdk/src/__tests__/http-client.test.ts`（修改，新增 blob 测试）

**Steps:**

- [ ] 在 `http-client.ts` 中新增 `RequestOptions` 类型：

```typescript
export interface RequestOptions extends RequestInit {
  /** 响应类型：'json'（默认）或 'blob'（文件下载） */
  responseType?: 'json' | 'blob';
}
```

- [ ] 修改 `HttpClient` 接口签名：

```typescript
export interface HttpClient {
  request<T>(url: string, init?: RequestOptions): Promise<T>;
}
```

- [ ] 修改 `executeRequest` 内部逻辑，在 `response.json()` 之前判断 `responseType`：

```typescript
// 204 No Content
if (response.status === 204) return undefined as T;

// blob 响应（文件下载）
if (init?.responseType === 'blob') {
  return response.blob() as Promise<T>;
}

return response.json() as Promise<T>;
```

- [ ] 新增 `triggerDownload` 工具函数导出（放在 `http-client.ts` 底部或独立 `download.ts`）：

```typescript
/**
 * 触发浏览器下载。配合 HttpClient blob 响应使用。
 * @param blob - 文件 Blob
 * @param filename - 下载文件名
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] 在 `index.ts` 中导出 `triggerDownload` 和 `RequestOptions` 类型：

```typescript
export type { RequestOptions } from './http-client';
export { triggerDownload } from './http-client';
```

- [ ] 新增测试用例：blob 响应返回 Blob 对象（mock fetch 返回 `new Response(new Blob(['test']))`)

**Verify:**

```bash
cd client && pnpm -F @mb/api-sdk test
cd client && pnpm check:types
```

**Commit:** `feat(api-sdk): HttpClient 新增 blob 响应支持 + triggerDownload 工具函数`

---

### Task 3: orval 安装 + 配置 + 首次生成 + api-sdk 重构

**Files:**
- `client/package.json`（新增 orval devDependency + `generate:api-sdk` script）
- `client/orval.config.ts`（新建）
- `client/packages/api-sdk/src/mutator/custom-instance.ts`（新建）
- `client/packages/api-sdk/src/index.ts`（重构导出）
- `client/packages/api-sdk/src/types/index.ts`（新建，手写类型统一导出）
- `client/packages/api-sdk/package.json`（exports 新增 `./types`）
- `.gitignore`（新增 generated/ 排除）
- `server/api-contract/openapi-v1.json`（新建，首次从运行中的后端抓取）

**Steps:**

- [ ] 安装 orval 到根 workspace devDependency：

```bash
cd client && pnpm add -Dw orval@^7.5
```

> 注意：orval 8.x 尚未正式发布，用最新稳定 7.x。安装后确认版本。

- [ ] 在 `client/package.json` 的 `scripts` 中新增：

```json
"generate:api-sdk": "orval --config orval.config.ts"
```

- [ ] 创建 `client/orval.config.ts`：

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
      mock: true,
      override: {
        mutator: {
          path: './packages/api-sdk/src/mutator/custom-instance.ts',
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

- [ ] 创建 `client/packages/api-sdk/src/mutator/custom-instance.ts`：

```typescript
import { getClient } from '../config';

/**
 * orval mutator — 薄包装，委托给现有 HttpClient。
 *
 * 所有拦截器（auth token / Accept-Language / X-Request-ID / error / 401 refresh）
 * 在 HttpClient 内部处理，mutator 不需要重复实现。
 *
 * 签名匹配 orval fetch 模式要求：(url: string, options: RequestInit) => Promise<T>
 */
export const customInstance = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  return getClient().request<T>(url, options);
};

export default customInstance;
```

- [ ] 更新 `.gitignore`，将已有的 `client/packages/api-sdk/src/gen/` 行替换为：

```
# @mb/api-sdk orval 生成物（不入 git，CI 从 openapi-v1.json 生成）
client/packages/api-sdk/src/generated/
```

- [ ] 创建 `client/packages/api-sdk/src/types/index.ts`，将手写类型统一导出：

```typescript
// 手写类型 — 不被 orval 生成替代
export type { PageResult, ProblemDetail } from './common';
export type { LoginCmd, LoginVo, UserSummary, RefreshCmd, CurrentUserVo } from './auth';
export type { MenuNodeDto, CurrentUserMenuVo } from './menu';
export type { AppPermission } from './permission';
export { ALL_APP_PERMISSIONS } from './permission';
```

- [ ] 重构 `client/packages/api-sdk/src/index.ts`：

```typescript
// === 手写类型（保留，不被 orval 替代）===
export type { PageResult, ProblemDetail } from './types/common';
export type { LoginCmd, LoginVo, UserSummary, RefreshCmd, CurrentUserVo } from './types/auth';
export type { MenuNodeDto, CurrentUserMenuVo } from './types/menu';
export type { AppPermission } from './types/permission';
export { ALL_APP_PERMISSIONS } from './types/permission';

// === orval 生成的类型和 hooks ===
// 首次生成后取消注释（Task 3 首次生成仅有 auth/menu 端点）
// export * from './generated/models';
// export * from './generated/endpoints';

// === 错误 ===
export { ProblemDetailError, isProblemDetail } from './errors';

// === 配置 ===
export { configureApiSdk } from './config';
export type { ApiSdkConfig } from './config';

// === HTTP 工具 ===
export type { RequestOptions } from './http-client';
export { triggerDownload } from './http-client';

// === API 门面（手写，保留）===
export { authApi } from './apis/auth-api';
export { menuApi } from './apis/menu-api';
```

- [ ] 更新 `client/packages/api-sdk/package.json` 的 `exports`：

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/apis/auth-api.ts",
    "./types": "./src/types/index.ts"
  }
}
```

- [ ] 获取首次 openapi.json：

```bash
# 确保后端运行中（另一个终端 cd server && mvn spring-boot:run -pl mb-admin）
mkdir -p server/api-contract
curl http://localhost:8080/api-docs -o server/api-contract/openapi-v1.json
```

> 如果后端未运行，先启动后端，等健康检查通过再抓取。首次生成只有 auth + menu 端点。

- [ ] 运行 orval 首次生成：

```bash
cd client && pnpm generate:api-sdk
```

- [ ] 确认生成产物在 `client/packages/api-sdk/src/generated/` 下，文件结构符合预期（endpoints/ + models/ + mocks/）

- [ ] 取消 `index.ts` 中 generated 导出的注释（如果生成产物有效）

**Verify:**

```bash
cd client && pnpm check:types
cd client && pnpm lint
```

**Commit:** `feat(api-sdk): orval OpenAPI 管线搭建 + 首次生成 + mutator 薄包装`

---

## Phase 2: Notice 后端

### Task 4: 模块脚手架（mb-business pom 改造 + business-notice 创建 + root pom 依赖管理 + mb-admin 依赖）

**Files:**
- `server/mb-business/pom.xml`（改造为 pom 聚合模块）
- `server/mb-business/business-notice/pom.xml`（新建）
- `server/pom.xml`（新增 `business-notice` + `fastexcel` + `jsoup` 到 dependencyManagement/properties）
- `server/mb-admin/pom.xml`（新增 `business-notice` 依赖）

**Steps:**

- [ ] 改造 `server/mb-business/pom.xml` 为聚合模块：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-business</artifactId>
    <packaging>pom</packaging>
    <name>mb-business</name>
    <description>使用者扩展位 + canonical reference 业务模块（ADR-0004）</description>

    <modules>
        <module>business-notice</module>
    </modules>
</project>
```

- [ ] 创建 `server/mb-business/business-notice/pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>mb-business</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>business-notice</artifactId>
    <name>business-notice</name>
    <description>通知公告模块（M5 canonical reference）</description>

    <dependencies>
        <!-- 内部模块 -->
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>mb-common</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>mb-schema</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-jooq</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-exception</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>platform-log</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>platform-file</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>platform-notification</artifactId>
        </dependency>

        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- OpenAPI 注解 -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        </dependency>

        <!-- Excel 导出 -->
        <dependency>
            <groupId>cn.idev.excel</groupId>
            <artifactId>fastexcel</artifactId>
        </dependency>

        <!-- HTML 净化 -->
        <dependency>
            <groupId>org.jsoup</groupId>
            <artifactId>jsoup</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] 在 `server/pom.xml` 的 `<properties>` 中新增版本号：

```xml
<fastexcel.version>1.1.0</fastexcel.version>
<jsoup.version>1.18.3</jsoup.version>
```

- [ ] 在 `server/pom.xml` 的 `<dependencyManagement>` 中新增：

```xml
<!-- business-notice -->
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>business-notice</artifactId>
    <version>${revision}</version>
</dependency>

<!-- FastExcel（Excel 导出） -->
<dependency>
    <groupId>cn.idev.excel</groupId>
    <artifactId>fastexcel</artifactId>
    <version>${fastexcel.version}</version>
</dependency>

<!-- jsoup（HTML 净化） -->
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>${jsoup.version}</version>
</dependency>
```

- [ ] 在 `server/mb-admin/pom.xml` 的 `<!-- 内部模块 — platform 业务层 -->` 之后新增：

```xml
<!-- 内部模块 — business 业务层 -->
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>business-notice</artifactId>
</dependency>
```

- [ ] 创建 Java 包目录结构：

```bash
mkdir -p server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/{api,domain,web,config}
mkdir -p server/mb-business/business-notice/src/main/resources
```

- [ ] 创建 `package-info.java`（ArchUnit 边界声明）：

`server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/package-info.java`：
```java
/**
 * 通知公告模块（business-notice）。
 *
 * 允许依赖：
 * - com.metabuild.common.*
 * - com.metabuild.schema.*
 * - com.metabuild.infra.security.*
 * - com.metabuild.infra.jooq.*
 * - com.metabuild.infra.exception.*
 * - com.metabuild.platform.log.*
 * - com.metabuild.platform.file.*
 * - com.metabuild.platform.notification.*
 */
package com.metabuild.business.notice;
```

**Verify:**

```bash
cd server && mvn validate -pl mb-business/business-notice
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): business-notice 模块脚手架 + root pom 依赖管理`

---

### Task 5: DDL（4 张表 + 索引 + FK + 注释）+ jOOQ codegen includes 修改 + codegen 运行

**Files:**
- `server/mb-schema/src/main/resources/db/migration/V20260615_001__notice.sql`（新建）
- `server/mb-schema/pom.xml`（修改 codegen includes）

**Steps:**

- [ ] 创建 DDL 文件 `server/mb-schema/src/main/resources/db/migration/V20260615_001__notice.sql`：

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

- [ ] 修改 `server/mb-schema/pom.xml` 第 152 行，将 jOOQ codegen includes 从：

```xml
<includes>mb_.*</includes>
```

改为：

```xml
<includes>(mb_|biz_).*</includes>
```

- [ ] 运行 jOOQ codegen 生成新表的 Java 类型：

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

- [ ] 确认生成产物包含 `BizNotice`、`BizNoticeTarget`、`BizNoticeRecipient`、`BizNoticeAttachment` 四个表对应的 jOOQ Record/Table 类

**Verify:**

```bash
cd server && mvn compile -pl mb-schema
# 确认 biz_ 表的 jOOQ 类存在
ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/BizNotice.java
ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/BizNoticeTarget.java
ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/BizNoticeRecipient.java
ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/BizNoticeAttachment.java
```

**Commit:** `feat(notice): DDL 4 张表 + jOOQ codegen includes 扩展 biz_ 前缀`

---

### Task 6: Notice 基础 CRUD（Repository + Service + Controller）

**Files:**（全部新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeStatus.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeRepository.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeService.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/vo/NoticeVo.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/vo/NoticeDetailVo.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/cmd/NoticeCreateCmd.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/cmd/NoticeUpdateCmd.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/qry/NoticeQry.java`
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/web/NoticeController.java`

**Steps:**

- [ ] 创建 `NoticeStatus` 枚举：

```java
package com.metabuild.business.notice.domain;

public enum NoticeStatus {
    DRAFT(0),
    PUBLISHED(1),
    REVOKED(2);

    private final int code;
    NoticeStatus(int code) { this.code = code; }
    public int code() { return code; }

    public static NoticeStatus fromCode(int code) {
        for (NoticeStatus s : values()) if (s.code == code) return s;
        throw new IllegalArgumentException("未知状态码: " + code);
    }
}
```

- [ ] 创建 `NoticeRepository`：jOOQ 查询封装
  - `PageResult<NoticeVo> findPage(NoticeQry query, Long currentUserId)` — 分页列表，JOIN recipient 获取当前用户已读状态，聚合 readCount/recipientCount
  - `Optional<NoticeDetailVo> findById(Long id, Long currentUserId)` — 详情含附件 + targets + readCount/recipientCount
  - `int insert(BizNoticeRecord record)` — 插入
  - `int update(BizNoticeRecord record)` — 更新（含乐观锁 WHERE version = ?）
  - `int deleteById(Long id)` — 物理删除
  - 所有查询方法通过 jOOQ 的 DSL 构建，**不泄漏 jOOQ 类型到 Service 层**

- [ ] 创建 DTO record 类（在 `api` 包下）：
  - `NoticeVo` — 列表视图（id, title, status, pinned, startTime, endTime, createdByName, createdAt, updatedAt, read, readCount, recipientCount）
  - `NoticeDetailVo` — 详情视图（含 content, attachments, targets, version）
  - `NoticeCreateCmd` — 新增（@NotBlank title, @Size content, pinned, startTime, endTime, @Size(max=10) attachmentFileIds）
  - `NoticeUpdateCmd` — 编辑（同 Create + @NotNull version）
  - `NoticeQry` — 查询条件（status, keyword, startTimeFrom, startTimeTo, page, size, sort）

- [ ] 创建 `NoticeService`：
  - `PageResult<NoticeVo> list(NoticeQry query)` — 从 CurrentUser 获取 userId，委托 Repository
  - `NoticeDetailVo detail(Long id)` — 委托 Repository
  - `NoticeVo create(NoticeCreateCmd cmd)` — 生成 Snowflake ID，sanitizeHtml(content)，设置 ownerDeptId（从 CurrentUser.deptId()），插入，处理附件关联
  - `NoticeVo update(Long id, NoticeUpdateCmd cmd)` — **校验 status == DRAFT**，否则抛 400 `notice.onlyDraftCanEdit`；sanitizeHtml；乐观锁更新（version 不匹配抛 409）
  - `void delete(Long id)` — **校验 status == DRAFT 或 REVOKED**，否则抛 400 `notice.onlyDraftOrRevokedCanDelete`
  - 内部 `sanitizeHtml(String html)` 方法使用 jsoup `Safelist.relaxed()` 扩展（见 spec 3.6）

- [ ] 创建 `NoticeController`：
  - `@RestController @RequestMapping("/api/v1/notices")`
  - `GET /` — `@RequirePermission("notice:notice:list")` → list
  - `GET /{id}` — `@RequirePermission("notice:notice:detail")` → detail
  - `POST /` — `@RequirePermission("notice:notice:create")` + `@OperationLog(module = "notice", type = "创建公告")` → create → 201
  - `PUT /{id}` — `@RequirePermission("notice:notice:update")` + `@OperationLog` → update
  - `DELETE /{id}` — `@RequirePermission("notice:notice:delete")` + `@OperationLog` → delete → 204
  - `@Operation` / `@Parameter` / `@Tag` springdoc 注解

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): 基础 CRUD — Repository + Service + Controller + DTO`

---

### Task 7: 状态机（publish + revoke + duplicate）+ DataScopeConfig 注册

**Files:**
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeService.java`（追加方法）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/cmd/NoticePublishCmd.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/NoticeTarget.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/cmd/BatchIdsCmd.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/vo/BatchResultVo.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/web/NoticeController.java`（追加端点）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/config/NoticeDataScopeConfig.java`（新建）

**Steps:**

- [ ] 创建 DTO：
  - `NoticePublishCmd` — `@NotEmpty List<NoticeTarget> targets`
  - `NoticeTarget` — `@NotNull String targetType`, `Long targetId`（ALL 时为 null）
  - `BatchIdsCmd` — `@NotEmpty @Size(max=100) List<Long> ids`
  - `BatchResultVo` — `int success, int skipped`

- [ ] 在 `NoticeService` 中新增方法：
  - `NoticeVo publish(Long id, NoticePublishCmd cmd)` — 校验 status == DRAFT，**此处只做状态变更为 PUBLISHED**（recipient 展开在 Task 9 实现）
  - `NoticeVo revoke(Long id)` — 校验 status == PUBLISHED，变更为 REVOKED
  - `NoticeVo duplicate(Long id)` — 校验 status == PUBLISHED 或 REVOKED，复制 title/content/pinned/startTime/endTime + 附件关联，生成新 DRAFT 公告
  - `BatchResultVo batchPublish(BatchIdsCmd cmd)` — 遍历 ids，逐条校验状态，合规的调 publish（简化版，不展开 recipient），不合规的 skip
  - `BatchResultVo batchDelete(BatchIdsCmd cmd)` — 遍历 ids，逐条校验状态（DRAFT/REVOKED），合规的删除

- [ ] 在 `NoticeController` 中新增端点：
  - `POST /{id}/publish` — `@RequirePermission("notice:notice:publish")` + `@OperationLog`
  - `POST /{id}/revoke` — `@RequirePermission("notice:notice:publish")` + `@OperationLog`
  - `POST /{id}/duplicate` — `@RequirePermission("notice:notice:create")` + `@OperationLog` → 201
  - `POST /batch-publish` — `@RequirePermission("notice:notice:publish")` + `@OperationLog`
  - `DELETE /batch` — `@RequirePermission("notice:notice:delete")` + `@OperationLog`

- [ ] 创建 `NoticeDataScopeConfig`：

```java
package com.metabuild.business.notice.config;

import com.metabuild.infra.jooq.datascope.DataScopeRegistry;
import org.springframework.context.annotation.Configuration;

import static com.metabuild.schema.tables.BizNotice.BIZ_NOTICE;

@Configuration
public class NoticeDataScopeConfig {
    public NoticeDataScopeConfig(DataScopeRegistry registry) {
        registry.register("biz_notice", BIZ_NOTICE.OWNER_DEPT_ID);
    }
}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): 状态机（publish/revoke/duplicate/batch）+ DataScope 注册`

---

### Task 8: 附件（NoticeAttachmentRepository + Service 集成 platform-file）+ @OperationLog

**Files:**
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeAttachmentRepository.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/vo/AttachmentVo.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeService.java`（修改，集成附件逻辑）

**Steps:**

- [ ] 创建 `AttachmentVo`：

```java
package com.metabuild.business.notice.api;

public record AttachmentVo(Long fileId, String fileName, Long fileSize, String url) {}
```

- [ ] 创建 `NoticeAttachmentRepository`：
  - `void batchInsert(Long noticeId, List<Long> fileIds, Long createdBy, Long tenantId)` — 批量插入附件关联，设置 sortOrder 按 list 顺序
  - `void deleteByNoticeId(Long noticeId)` — 删除公告的所有附件关联
  - `List<AttachmentVo> findByNoticeId(Long noticeId)` — 查附件列表（JOIN platform-file 的 `mb_file` 表获取 fileName/fileSize/url，或通过 platform-file API 获取）

- [ ] 修改 `NoticeService`：
  - `create` 方法：插入 notice 后，如果 `attachmentFileIds` 非空，调 `NoticeAttachmentRepository.batchInsert`
  - `update` 方法：先 `deleteByNoticeId`，再 `batchInsert`（全量替换策略）
  - `delete` 方法：先 `deleteByNoticeId`，再删除 notice
  - `duplicate` 方法：复制原公告的附件关联
  - 附件 file_id 校验：调用 platform-file 的 API 确认 file_id 存在且属于当前租户

- [ ] 确认所有 Controller 端点的 `@OperationLog` 注解正确：
  - import 路径：`com.metabuild.common.log.OperationLog`
  - 模块名：`"notice"`
  - 类型：`"创建公告"` / `"编辑公告"` / `"删除公告"` / `"发布公告"` / `"撤回公告"` / `"复制公告"`

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): 附件关联 CRUD + platform-file 集成 + @OperationLog`

---

### Task 9: 通知目标（Target CRUD）+ 发布流程（展开 recipient + batchInsert + Spring Event）

**Files:**
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeTargetRepository.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeRecipientRepository.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticePublishedEvent.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticePublishedEventListener.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/vo/NoticeTargetVo.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeService.java`（修改 publish 方法）

**Steps:**

- [ ] 创建 `NoticeTargetVo`：

```java
public record NoticeTargetVo(String targetType, Long targetId, String targetName) {}
```

- [ ] 创建 `NoticeTargetRepository`：
  - `void batchInsert(Long noticeId, List<NoticeTarget> targets)` — 批量插入 target
  - `void deleteByNoticeId(Long noticeId)` — 删除公告的所有 target
  - `List<NoticeTargetVo> findByNoticeId(Long noticeId)` — 查 target 列表（targetName 需 JOIN dept/role/user 表）

- [ ] 创建 `NoticeRecipientRepository`：
  - `void batchInsert(Long noticeId, List<Long> userIds)` — **分批插入，每批 500 条**，使用 jOOQ batch insert
  - `void deleteByNoticeId(Long noticeId)` — 删除
  - `int countByNoticeId(Long noticeId)` — 总接收人数
  - `int countReadByNoticeId(Long noticeId)` — 已读人数

- [ ] 创建 `NoticePublishedEvent`（Spring ApplicationEvent）：

```java
package com.metabuild.business.notice.domain;

public record NoticePublishedEvent(
    Long noticeId,
    String title,
    List<Long> recipientUserIds
) {}
```

- [ ] 创建 `NoticePublishedEventListener`：

```java
@Component
@RequiredArgsConstructor
public class NoticePublishedEventListener {

    private final NotificationDispatcher notificationDispatcher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onNoticePublished(NoticePublishedEvent event) {
        notificationDispatcher.dispatch(new NotificationMessage(
            0L, // tenantId（v1 默认 0）
            event.recipientUserIds(),
            "notice_published",
            Map.of("title", event.title()),
            "notice",
            String.valueOf(event.noticeId())
        ));
    }
}
```

- [ ] 修改 `NoticeService.publish()` 方法，完善发布流程：

```java
@Transactional
public NoticeVo publish(Long id, NoticePublishCmd cmd) {
    // 1. 校验 status == DRAFT
    // 2. 更新 status = PUBLISHED
    // 3. 写入 biz_notice_target
    // 4. 展开 targets → userIds
    //    - ALL: 查全部用户（@BypassDataScope，全员公告需跨部门）
    //    - DEPT: 查部门下所有用户
    //    - ROLE: 查角色下所有用户
    //    - USER: 直接使用 targetId
    //    - 去重
    // 5. batchInsert 到 biz_notice_recipient（每批 500 条）
    // 6. publishEvent(new NoticePublishedEvent(id, title, recipientUserIds))
    // 7. 返回 NoticeVo
}
```

- [ ] recipient 展开时使用 `@BypassDataScope` 注解（全员公告需查跨部门用户），权限由 `notice:notice:publish` 门控

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): 发布流程（target + recipient 展开 + 分批写入 + Spring Event）`

---

### Task 10: 已读/未读（markRead + unreadCount + recipients 列表 + readCount/recipientCount 聚合）

**Files:**
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeRecipientRepository.java`（追加方法）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeService.java`（追加方法）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/api/vo/RecipientVo.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/web/NoticeController.java`（追加端点）

**Steps:**

- [ ] 创建 `RecipientVo`：

```java
public record RecipientVo(Long userId, String username, Instant readAt) {}
```

- [ ] 在 `NoticeRecipientRepository` 中追加方法：
  - `boolean markRead(Long noticeId, Long userId, Instant readAt)` — `UPDATE biz_notice_recipient SET read_at = ? WHERE notice_id = ? AND user_id = ? AND read_at IS NULL`，返回影响行数 > 0（幂等：已读不更新）
  - `int unreadCount(Long userId)` — `SELECT count(*) FROM biz_notice_recipient WHERE user_id = ? AND read_at IS NULL`
  - `PageResult<RecipientVo> findRecipients(Long noticeId, String readStatus, int page, int size)` — 分页查接收人列表，readStatus 过滤（all/read/unread），JOIN user 表获取 username

- [ ] 在 `NoticeService` 中追加方法：
  - `void markRead(Long noticeId)` — 从 CurrentUser 获取 userId，委托 Repository
  - `int unreadCount()` — 从 CurrentUser 获取 userId，委托 Repository
  - `PageResult<RecipientVo> recipients(Long noticeId, String readStatus, int page, int size)` — 委托 Repository

- [ ] 在 `NoticeController` 中追加端点：
  - `PUT /{id}/read` — **无权限注解**（已登录即可） → markRead → 204
  - `GET /unread-count` — **无权限注解**（已登录即可） → unreadCount → `{ "count": N }`
  - `GET /{id}/recipients` — `@RequirePermission("notice:notice:detail")` → recipients → PageResult

- [ ] 确认 `NoticeVo` 和 `NoticeDetailVo` 中的 `readCount` / `recipientCount` 已通过 Repository 聚合查询填充（在 Task 6 的 Repository 层实现）

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): 已读/未读（markRead + unreadCount + recipients 列表）`

---

### Task 11: Excel 导出（FastExcel + 流式查询 + Formula 注入防护 + 限流）

**Files:**
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticeExportService.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/FormulaInjectionHandler.java`（新建）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/web/NoticeController.java`（追加 export 端点）

**Steps:**

- [ ] 创建 `FormulaInjectionHandler` — FastExcel `CellWriteHandler` 实现：

```java
package com.metabuild.business.notice.domain;

import cn.idev.excel.write.handler.CellWriteHandler;
import cn.idev.excel.write.handler.context.CellWriteHandlerContext;

/**
 * CSV Formula 注入防护。
 * 对以 = + - @ \t \r 开头的字符串值前缀 '（单引号转义）。
 */
public class FormulaInjectionHandler implements CellWriteHandler {

    private static final String DANGEROUS_PREFIXES = "=+-@\t\r";

    @Override
    public void afterCellDispose(CellWriteHandlerContext context) {
        var cell = context.getCell();
        if (cell != null && cell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
            String value = cell.getStringCellValue();
            if (value != null && !value.isEmpty()
                && DANGEROUS_PREFIXES.indexOf(value.charAt(0)) >= 0) {
                cell.setCellValue("'" + value);
            }
        }
    }
}
```

- [ ] 创建 `NoticeExportService`：
  - `void export(NoticeQry query, OutputStream out)` — 分页查询（每页 1000 条）→ FastExcel 流式写入
  - **行数上限 10 万行**，超出截断并在最后一行提示"数据量过大，请缩小筛选范围"
  - 注册 `FormulaInjectionHandler`
  - 导出字段：标题 / 状态（中文映射） / 置顶 / 生效时间 / 失效时间 / 创建人 / 创建时间 / 已读率
  - **排除 content 字段**

- [ ] 在 `NoticeController` 中追加 export 端点：

```java
@GetMapping("/export")
@RequirePermission("notice:notice:export")
@OperationLog(module = "notice", type = "导出公告")
public void export(NoticeQry query, HttpServletResponse response) {
    // 限流检查：每用户每分钟 1 次 + 全局并发上限 3
    // 设置 response headers
    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", "attachment;filename=notices.xlsx");
    // 委托 NoticeExportService
    noticeExportService.export(query, response.getOutputStream());
}
```

- [ ] 导出限流实现（使用 infra-rate-limit 的 Bucket4j）：
  - 每用户每分钟 1 次：key = `export:notice:user:{userId}`，capacity=1, refill=1/minute
  - 全局并发上限 3：`AtomicInteger` 或 `Semaphore`，超出返回 429

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): Excel 导出（FastExcel + Formula 防护 + 限流）`

---

### Task 12: 集成测试（~32 用例，覆盖全部端点 + 状态机 + 权限 + 数据权限 + XSS）

**Files:**
- `server/mb-admin/src/test/java/com/metabuild/admin/notice/NoticeIntegrationTest.java`（新建）

**Steps:**

- [ ] 创建测试类 `NoticeIntegrationTest`，继承项目的测试基类（`AbstractIntegrationTest` 或 `@SpringBootTest + @Testcontainers`），使用 `@Sql` 或 `DSLContext` 准备测试数据

- [ ] 实现以下测试用例（`@Test` 方法）：

**基础 CRUD（6 用例）：**
1. `createDraft_returns201` — 创建草稿，验证 201 + 字段正确
2. `updateDraft_returns200` — 编辑草稿，验证 200 + 字段更新
3. `updatePublished_returns400` — 编辑已发布公告，验证 400 + error code `notice.onlyDraftCanEdit`
4. `updateRevoked_returns400` — 编辑已撤回公告，验证 400
5. `deleteDraft_returns204` — 删除草稿，验证 204
6. `deletePublished_returns400` — 删除已发布公告，验证 400

**状态机（5 用例）：**
7. `publishDraft_statusBecomes1` — 发布含 targets 参数，验证 status 0→1 + recipient 展开
8. `revokePublished_statusBecomes2` — 撤回，验证 status 1→2
9. `duplicatePublished_returns201_newDraft` — 复制已发布公告为新草稿，验证 201 + 标题/正文/附件复制
10. `duplicateRevoked_returns201_newDraft` — 复制已撤回公告
11. `optimisticLockConflict_returns409` — 并发编辑乐观锁冲突，验证 409

**批量操作（2 用例）：**
12. `batchPublish_returnsSuccessAndSkipped` — 混合状态批量发布，验证 BatchResultVo
13. `batchDelete_returnsSuccessAndSkipped` — 混合状态批量删除

**查询（3 用例）：**
14. `listWithPagination_returnsPageResult` — 分页 + 筛选 + 排序
15. `listWithKeyword_matchesTitleOnly` — keyword 搜索仅匹配 title，不匹配 content
16. `deleteRevoked_returns204` — 删除已撤回公告

**附件（3 用例）：**
17. `createWithAttachments_attachmentsLinked` — 带附件创建，附件关联正确
18. `createWithTooManyAttachments_returns400` — 附件超过 10 个
19. `createWithInvalidFileId_returns400` — 附件 file_id 不存在

**已读/未读（5 用例）：**
20. `markRead_readAtUpdated` — 标记已读，read_at 从 NULL 变为当前时间
21. `markReadIdempotent_returns204` — 重复标记已读，幂等
22. `unreadCount_returnsCorrectCount` — 未读计数正确
23. `readRate_correctCounts` — readCount/recipientCount 正确
24. `recipientsList_paginationAndFilter` — 已读人员列表 + readStatus 过滤

**导出（2 用例）：**
25. `export_returnsXlsx` — 导出 200 + Content-Type xlsx
26. `exportRateLimit_returns429` — 连续导出触发 429

**权限（2 用例）：**
27. `noPermission_returns403` — 无权限访问返回 403
28. `dataScopeIsolation_differentDeptCantSee` — 不同部门用户只看到本部门公告

**XSS 净化（2 用例）：**
29. `contentXssSanitize_scriptRemoved` — 提交含 `<script>` 标签的 HTML，保存后 script 被移除
30. `contentStyleRemoved_styleAttrStripped` — 提交含 style 属性的 HTML，保存后 style 被移除

**通知分发（2 用例）：**
31. `publishTriggersNotification_eventFired` — 发布后通知事件触发（验证 `@TransactionalEventListener`）
32. `recipientExpansion_allType_queriesAllUsers` — ALL 类型 target 展开为全部用户

**Verify:**

```bash
cd server && mvn test -pl mb-admin -Dtest=NoticeIntegrationTest
```

**Commit:** `test(notice): 集成测试 32 用例（CRUD + 状态机 + 权限 + 数据权限 + XSS + 导出）`

---

### Task 13: 重新生成 openapi.json（含 notice 端点）+ orval 重新生成 SDK

**Files:**
- `server/api-contract/openapi-v1.json`（更新）
- `client/packages/api-sdk/src/generated/`（重新生成）
- `client/packages/api-sdk/src/index.ts`（取消 generated 导出注释 / 确认导出正确）
- `client/packages/api-sdk/src/types/permission.ts`（新增 notice 权限码）

**Steps:**

- [ ] 确保后端全部测试通过：

```bash
cd server && mvn verify
```

- [ ] 启动后端并抓取最新 openapi.json：

```bash
cd server && mvn spring-boot:run -pl mb-admin &
# 等待启动完成
sleep 15
curl http://localhost:8080/api-docs -o server/api-contract/openapi-v1.json
# 停止后端
kill %1
```

- [ ] 确认 `openapi-v1.json` 包含 notice 相关的全部端点（`/api/v1/notices` 系列）

- [ ] 运行 orval 重新生成前端 SDK：

```bash
cd client && pnpm generate:api-sdk
```

- [ ] 确认生成产物包含 notice 相关的 hooks 和类型（`generated/endpoints/notice.ts`、`generated/models/` 下的 Notice DTO 类型）

- [ ] 确保 `client/packages/api-sdk/src/index.ts` 正确导出 generated 内容：

```typescript
// === orval 生成的类型和 hooks ===
export * from './generated/models';
export * from './generated/endpoints';
```

- [ ] 在 `client/packages/api-sdk/src/types/permission.ts` 中新增 notice 权限码：

```typescript
  // notice
  | 'notice:notice:list'
  | 'notice:notice:detail'
  | 'notice:notice:create'
  | 'notice:notice:update'
  | 'notice:notice:delete'
  | 'notice:notice:publish'
  | 'notice:notice:export'
```

并在 `ALL_APP_PERMISSIONS` 数组中同步新增。

**Verify:**

```bash
cd client && pnpm check:types
cd client && pnpm lint
cd client && pnpm test
```

**Commit:** `feat(api-sdk): 重新生成 openapi.json（含 notice 端点）+ orval SDK + notice 权限码`

---

## 依赖关系

```
Task 1 (ADR)
Task 2 (blob)  ──→ Task 3 (orval) ──→ Task 13 (重新生成)
Task 4 (脚手架) ──→ Task 5 (DDL) ──→ Task 6 (CRUD) ──→ Task 7 (状态机) ──→ Task 8 (附件)
                                                                            ──→ Task 9 (发布) ──→ Task 10 (已读)
                                                                                               ──→ Task 11 (导出)
                                                                                               ──→ Task 12 (测试) ──→ Task 13
```

**可并行的 Task 组：**
- Task 1、Task 2、Task 4 三者互相独立，可并行
- Task 8、Task 9 依赖 Task 7，但 Task 8 和 Task 9 之间互相独立，可并行
- Task 10、Task 11 依赖 Task 9，但两者之间互相独立，可并行
- Task 12 依赖 Task 6-11 全部完成
- Task 13 依赖 Task 12（后端全部完成 + 测试通过后才能生成最终 openapi.json）

**建议执行顺序：**
1. 并行：Task 1 + Task 2 + Task 4
2. Task 3（依赖 Task 2）
3. Task 5（依赖 Task 4）
4. Task 6（依赖 Task 5）
5. Task 7（依赖 Task 6）
6. 并行：Task 8 + Task 9
7. 并行：Task 10 + Task 11
8. Task 12
9. Task 13（依赖 Task 3 + Task 12）

---

## M5 后续计划（Plan A 完成后）

M5 共拆分为 3 个独立计划，按顺序执行：

| 计划 | 范围 | 依赖 | 状态 |
|------|------|------|------|
| **Plan A**（本文档） | OpenAPI 管线 + Notice 后端 | 无 | 执行中 |
| **Plan B** | SSE 基础设施 + 通知渠道（站内信 + 邮件 + 微信公众号 + 小程序） | 依赖 Plan A | 待写 |
| **Plan C** | Notice 前端（orval hooks + 页面 + E2E）+ 实时能力（踢人下线/广播/权限推送） | 依赖 Plan A + B | 待写 |

**Plan A 完成后**：
1. 告知用户 Plan A 已完成
2. 读 spec `docs/superpowers/specs/2026-04-14-m5-notice-module-design.md` 的 Phase 3-6 段落
3. 用 `superpowers:writing-plans` 写 Plan B
4. 执行 Plan B
5. 写 Plan C → 执行 Plan C

**Plan B 和 Plan C 的并行可能性**：
- Plan B（SSE + 通知渠道）是纯后端
- Plan C 的前端部分不依赖通知渠道（只依赖 Plan A 的后端 API + orval SDK）
- Plan C 的 E2E 和实时能力部分依赖 Plan B
- 所以 Plan B 和 Plan C 前端部分可以并行，但 Plan C 的 E2E 必须等 Plan B
