# M5: Notice + 通知生态 + WebSocket 实时能力 — 设计文档

## 1. 目标

M5 不只是一个 CRUD demo，而是围绕 **notice（通知公告）** 构建完整的通知生态：

1. **OpenAPI 契约管线** — springdoc → openapi.json → typescript-fetch → 类型安全消费
2. **Notice CRUD** — 公告管理的完整前后端贯通（12 步清单首次实战）
3. **WebSocket 基础设施** — 业务无关的实时消息管道（infra-websocket）
4. **通知渠道系统** — platform-notification 升级：站内信 + Email + 微信公众号 + 微信小程序
5. **实时能力** — 踢人下线 / 权限变更推送 / 系统广播 / 公告发布推送

### 1.1 定位划分

| 层 | 模块 | 职责 |
|----|------|------|
| **infra** | `infra-websocket` | WebSocket 连接管理、认证、心跳、消息路由（业务无关） |
| **platform** | `platform-notification`（已有，升级） | 通知渠道抽象 + 分发调度 + 发送记录 + 模板管理 |
| **business** | `business-notice` | 公告 CRUD + 状态机 + 附件 + Excel 导出（消费 notification 分发公告） |

---

## 2. OpenAPI 契约管线

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

### 2.2 前端消费

```bash
# 根 devDependency
pnpm add -Dw @openapitools/openapi-generator-cli

# 生成命令
pnpm generate:api-sdk
# 等价于：openapi-generator-cli generate \
#   -i ../server/api-contract/openapi-v1.json \
#   -g typescript-fetch \
#   -o packages/api-sdk/src/generated \
#   --additional-properties=supportsES6=true,typescriptThreePlus=true
```

生成后结构：
```
packages/api-sdk/src/
├── generated/           # NOT in git（.gitignore）
│   ├── apis/*.ts        # NoticeApi, AuthApi, MenuApi ...
│   ├── models/*.ts      # NoticeView, NoticeCreateCommand ...
│   └── runtime.ts
├── index.ts             # 手写 facade（从 generated/ 重新导出 + 拦截器）
├── config.ts            # configureApiSdk（不变）
├── interceptors/        # 4 个拦截器 + refresh 逻辑（不变）
├── errors.ts            # ProblemDetailError（不变）
└── types/               # M3 手写类型 → 删除（被 generated/models/ 替代）
```

### 2.3 CI 集成

```yaml
- name: Generate API SDK
  run: cd client && pnpm generate:api-sdk    # 从 committed openapi-v1.json 生成
- name: Type check
  run: cd client && pnpm check:types         # 类型不匹配 = 契约 drift
```

CI 不启动后端，直接用 committed 的 openapi-v1.json。

---

## 3. Notice（通知公告）业务模块

### 3.1 模块位置

`server/mb-business/business-notice/`（CLAUDE.md：mb-business = 使用者扩展位 + canonical reference）

包结构：`com.metabuild.business.notice.{api, domain, web, config}`

### 3.2 DDL

**`V20260615_001__notice.sql`**：

```sql
-- 通知公告主表
CREATE TABLE biz_notice (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    status          SMALLINT NOT NULL DEFAULT 0,  -- 0=草稿 1=已发布 2=已撤回
    pinned          BOOLEAN NOT NULL DEFAULT FALSE,
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    owner_dept_id   BIGINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
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
COMMENT ON COLUMN biz_notice.status IS '状态：0=草稿 1=已发布 2=已撤回';

-- 公告附件关联表
CREATE TABLE biz_notice_attachment (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    file_id         BIGINT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_att_notice ON biz_notice_attachment (notice_id);
CREATE INDEX idx_notice_att_file ON biz_notice_attachment (file_id);
```

表前缀 `biz_`（business 层，区别于平台层 `mb_`）。

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
| POST | `/api/v1/notices/{id}/publish` | `notice:notice:publish` | 发布 → `NoticeView` |
| POST | `/api/v1/notices/{id}/revoke` | `notice:notice:publish` | 撤回 → `NoticeView` |
| POST | `/api/v1/notices/batch-publish` | `notice:notice:publish` | 批量发布 `{ ids: [...] }` |
| DELETE | `/api/v1/notices/batch` | `notice:notice:delete` | 批量删除 `{ ids: [...] }` |
| GET | `/api/v1/notices/export` | `notice:notice:export` | Excel 导出 → xlsx 流 |

### 3.5 DTO

```java
// 列表
public record NoticeView(Long id, String title, int status, boolean pinned,
    Instant startTime, Instant endTime, String createdByName,
    Instant createdAt, Instant updatedAt) {}

// 详情（含附件 + content + version）
public record NoticeDetailView(Long id, String title, String content, int status,
    boolean pinned, Instant startTime, Instant endTime,
    List<AttachmentView> attachments, String createdByName,
    Instant createdAt, Instant updatedAt, int version) {}

// 新增
public record NoticeCreateCommand(
    @NotBlank @Size(max = 200) String title, String content,
    boolean pinned, Instant startTime, Instant endTime,
    List<Long> attachmentFileIds) {}

// 编辑
public record NoticeUpdateCommand(
    @NotBlank @Size(max = 200) String title, String content,
    boolean pinned, Instant startTime, Instant endTime,
    List<Long> attachmentFileIds, @NotNull Integer version) {}

// 查询条件
public record NoticeQuery(Integer status, String keyword,
    Instant startTimeFrom, Instant startTimeTo,
    Integer page, Integer size, String sort) {}
```

关键词搜索用 `LIKE '%keyword%'`（v1 规模足够，全文搜索推迟到 v1.5）。

### 3.6 12 步清单对标

| 步骤 | 内容 | Notice 对应 |
|------|------|------------|
| 1 | 目录结构 | `mb-business/business-notice/` |
| 2 | pom.xml | parent=mb-business, deps: mb-common, mb-schema, infra-security, infra-jooq, infra-exception, platform-oplog, platform-file |
| 3 | Java 包 | `com.metabuild.business.notice.{api,domain,web,config}` |
| 4 | NoticeApi 接口 | api 包下，定义跨模块调用契约 |
| 5 | package-info.java | 声明允许的依赖（ArchUnit 强制） |
| 6 | Flyway DDL | `V20260615_001__notice.sql` |
| 7 | mb-business/pom.xml 注册 | `<module>business-notice</module>` |
| 8 | mb-admin/pom.xml 依赖 | `<dependency>business-notice</dependency>` |
| 9 | jOOQ codegen | `mvn -Pcodegen generate-sources -pl mb-schema` |
| 10 | Service + Repository + Controller | 见 3.4/3.5 |
| 10.1 | **DataScopeConfig 注册** | `registry.register("biz_notice", BIZ_NOTICE.OWNER_DEPT_ID)` |
| 10.2 | **DDL 含 owner_dept_id + 索引** | ✅ `idx_notice_tenant_dept` |
| 11 | 集成测试 + ArchUnit | 见 3.7 |
| 12 | 权限点注册 | 7 个权限码 `notice:notice:*` |

### 3.7 集成测试

| 用例 | 验证 |
|------|------|
| 创建草稿 | 201 + 字段正确 |
| 编辑草稿 | 200 + 字段更新 |
| 发布 | 状态 0→1 + 通知分发触发 |
| 撤回 | 状态 1→2 |
| 重新发布 | 状态 2→1 |
| 删除草稿 | 204 |
| 删除非草稿 | 400 |
| 批量发布 | 多条状态更新 |
| 批量删除 | 仅删除草稿，非草稿跳过 |
| 分页 + 筛选 + 排序 | PageResult 结构正确 |
| 带附件创建 | 附件关联正确 |
| 乐观锁冲突 | 409 |
| 权限不足 | 403 |
| **数据权限隔离** | 不同部门用户只看到本部门公告 |
| 导出 | 200 + Content-Type xlsx |
| 附件文件不存在 | 400 |

### 3.8 Excel 导出

使用 **EasyExcel**（阿里巴巴，流式写入低内存，适合大数据量导出，比 Apache POI SXSSF 更简洁）：
- `GET /notices/export` + 同列表筛选参数
- Service 流式查询 → EasyExcel 写入 → `StreamingResponseBody`

---

## 4. WebSocket 基础设施

### 4.1 定位

`server/mb-infra/infra-websocket/` — **业务无关**的实时消息管道。

职责：
- WebSocket 连接管理（建连/断连/心跳）
- Sa-Token 认证（握手阶段验证 token）
- 消息路由（按 topic/channel 分发）
- 在线用户感知（谁在线、在线时长）

**不**负责：具体业务消息的构造和触发（那是 business/platform 层的事）。

### 4.2 技术方案

Spring WebSocket（STOMP 协议）+ SockJS fallback：

```
前端 SockJS Client → WebSocket/HTTP Fallback → Spring STOMP Broker
```

- 握手时从 query param 或 header 取 Sa-Token，验证登录态
- 已认证用户自动订阅个人 topic：`/user/{userId}/queue/messages`
- 全局广播 topic：`/topic/broadcast`
- 心跳间隔：30s（可配置）

### 4.3 后端设计

```
infra-websocket/
├── WebSocketConfig.java           # @EnableWebSocketMessageBroker 配置
├── StompAuthInterceptor.java      # 握手阶段 Sa-Token 认证
├── WebSocketSessionRegistry.java  # 在线用户 session 管理
├── WebSocketMessageSender.java    # 发送消息的统一 API（供 platform/business 层调用）
└── WebSocketAutoConfiguration.java
```

**`WebSocketMessageSender`**（infra 层对外 API）：
```java
public interface WebSocketMessageSender {
    /** 发送给指定用户 */
    void sendToUser(Long userId, String destination, Object payload);
    /** 全局广播 */
    void broadcast(String destination, Object payload);
    /** 踢人下线（发送强制登出消息） */
    void forceLogout(Long userId, String reason);
    /** 获取在线用户 ID 集合 */
    Set<Long> getOnlineUserIds();
}
```

### 4.4 前端设计

L4 `@mb/app-shell` 新增 `websocket/` 子模块：

```
packages/app-shell/src/websocket/
├── use-websocket.ts       # useWebSocket() hook — 自动连接/断连/重连
├── use-ws-subscription.ts # useWsSubscription(topic, handler) — 订阅消息
├── ws-client.ts           # SockJS + STOMP client 封装
├── types.ts               # WsMessage 类型定义
└── index.ts
```

**`useWebSocket()`**：
- 登录后自动连接，登出时断连
- 心跳 30s，断线自动重连（指数退避，最大 60s）
- 内置处理 `force-logout` 消息（清 token → 跳登录）

**`useWsSubscription(topic, handler)`**：
- 业务组件订阅特定 topic
- 返回 unsubscribe cleanup

### 4.5 实时能力

| 能力 | 触发 | WebSocket 消息 | 前端处理 |
|------|------|---------------|---------|
| **踢人下线** | admin 在用户管理页点"强制下线" | `forceLogout(userId, reason)` → `/user/{id}/queue/force-logout` | 清 token + toast "您已被管理员下线" + 跳登录 |
| **权限变更** | admin 修改角色权限 | `sendToUser(userId, '/queue/permission-changed')` | `invalidateQueries(['auth', 'me'])` 刷新权限缓存 |
| **公告发布** | notice 发布 → NotificationDispatcher | `broadcast('/topic/notice')` → 全员 | toast "新公告：xxx" + 刷新列表 |
| **系统广播** | admin 发送维护通知 | `broadcast('/topic/system')` | 全局 alert banner |

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

**1. 站内信 + WebSocket 推送（InAppChannel）**
- 写入 `mb_notification` 表（已有）
- 同时通过 `WebSocketMessageSender.sendToUser()` 实时推送
- 前端 toast + 未读数更新

**2. 邮件（EmailChannel）**
- Spring Boot `JavaMailSender` + Thymeleaf 模板
- 配置：`spring.mail.host/port/username/password`（via `platform-config` 或 yml）
- `@Async` 异步发送
- 用户邮箱从 `mb_iam_user.email` 字段取

**3. 微信公众号模板消息（WeChatMpChannel）**
- 调用微信 API：`POST https://api.weixin.qq.com/cgi-bin/message/template/send`
- 需要：`appId` + `appSecret`（配置在 platform-config）
- 需要：用户 openid 绑定表 `mb_user_wechat_binding`
- 模板消息格式：`{ touser, template_id, url, data: { first, keyword1, ... } }`

**4. 微信小程序订阅消息（WeChatMiniChannel）**
- 调用微信 API：`POST https://api.weixin.qq.com/cgi-bin/message/subscribe/send`
- 需要：小程序 `appId` + `appSecret`
- 需要：用户 openid（小程序和公众号的 openid 不同，需要分别绑定）
- 用户需主动订阅（一次性订阅 or 长期订阅）

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
```

### 5.4 微信配置

通过 `platform-config` 存储（加密敏感字段）：

| 配置 key | 说明 |
|----------|------|
| `wechat.mp.appId` | 公众号 AppID |
| `wechat.mp.appSecret` | 公众号 AppSecret（加密存储） |
| `wechat.mp.templateId.notice` | 公告通知模板 ID |
| `wechat.mini.appId` | 小程序 AppID |
| `wechat.mini.appSecret` | 小程序 AppSecret（加密存储） |
| `wechat.mini.templateId.notice` | 公告订阅消息模板 ID |

appId/appSecret 暂时留空，洋哥后续补充。代码层面做好空值检查 — 未配置的渠道跳过不报错。

### 5.5 通知分发器

```java
@Service
public class NotificationDispatcher {
    private final List<NotificationChannel> channels;  // Spring 自动注入全部实现
    private final NotificationLogRepository logRepo;

    public void dispatch(NotificationMessage message) {
        for (NotificationChannel channel : channels) {
            if (channel.supports(message)) {
                try {
                    channel.send(message);
                    logRepo.logSuccess(message, channel.channelType());
                } catch (NotificationException e) {
                    logRepo.logFailure(message, channel.channelType(), e.getMessage());
                    // 不抛出 — 单渠道失败不影响其他渠道
                }
            }
        }
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
```

### 5.7 Notice → 通知串联

```
NoticeService.publish(id)
  → update status = PUBLISHED
  → Spring @EventListener: NoticePublishedEvent
  → NotificationDispatcher.dispatch(NotificationMessage{
      recipientUserIds: [全员或按部门],
      templateCode: "notice_published",
      params: { title: notice.title },
      module: "notice",
      referenceId: notice.id
    })
  → InAppChannel: 写 mb_notification + WS 推送
  → EmailChannel: 异步发邮件
  → WeChatMpChannel: 调微信模板消息 API
  → WeChatMiniChannel: 调微信订阅消息 API
```

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
  "form": { "title": "公告标题", "content": "公告内容", "pinned": "置顶", "startTime": "生效时间", "endTime": "失效时间", "attachments": "附件" },
  "status": { "draft": "草稿", "published": "已发布", "revoked": "已撤回" },
  "action": { "create": "新增公告", "edit": "编辑", "delete": "删除", "publish": "发布", "revoke": "撤回" },
  "confirm": { "delete": "确定删除此公告？", "publish": "确定发布此公告？", "revoke": "确定撤回此公告？" },
  "filter": { "status": "状态", "keyword": "关键词", "dateRange": "日期范围" },
  "batch": { "selected": "已选择 {count} 项", "delete": "批量删除", "publish": "批量发布" }
}
```

对应 `en-US/notice.json`。

### 6.3 列表页

- `NxFilter`：状态 + 关键词 + 日期范围
- `NxTable`：标题（link 到详情）、状态 Badge、置顶图标、生效时间、创建人、操作列
- `NxBar`：批量删除 + 批量发布
- 操作列：根据状态+权限动态显示（编辑/发布/撤回/删除/详情）
- 导出按钮（受 `notice:notice:export` 权限控制）

### 6.4 新增/编辑（NxDrawer + NxForm）

- Zod schema 验证（title 必填 max 200）
- 富文本编辑：**TipTap**（`@tiptap/react` + `@tiptap/starter-kit` + image extension）
- 附件上传：调 platform-file API，获取 fileId 列表
- 脏检查：修改后关闭 Drawer 弹确认

### 6.5 详情页

- 富文本渲染：`dangerouslySetInnerHTML` + **DOMPurify** 净化（禁用 script/iframe/on* 事件）
- 附件下载列表
- 状态操作按钮（发布/撤回/编辑/删除）
- 返回列表

### 6.6 WebSocket 集成

```tsx
// 在 App 根组件或 _authed layout 中
useWsSubscription('/user/queue/force-logout', (msg) => {
  toast.error(`您已被管理员下线：${msg.reason}`);
  logout();
});

useWsSubscription('/topic/notice', (msg) => {
  toast.info(`新公告：${msg.title}`);
  queryClient.invalidateQueries({ queryKey: ['notices'] });
});

useWsSubscription('/user/queue/permission-changed', () => {
  queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
});
```

### 6.7 权限守卫

```tsx
// 路由级
beforeLoad: requireAuth({ permission: 'notice:notice:list' })

// 按钮级
{user.hasPermission('notice:notice:create') && <Button>新增</Button>}
{user.hasPermission('notice:notice:publish') && status === 0 && <Button>发布</Button>}
```

### 6.8 E2E 测试（Playwright）

| 场景 | 步骤 |
|------|------|
| 新增草稿 | 登录→列表→新增→填写→保存→出现 |
| 编辑 | 编辑→修改→保存→更新 |
| 发布 | 发布→确认→状态变更 |
| 撤回 | 撤回→确认→状态变更 |
| 删除草稿 | 删除→确认→消失 |
| 批量发布 | 勾选→批量发布→全部更新 |
| 导出 | 导出→下载 xlsx |
| 权限控制 | 无 publish 权限看不到发布按钮 |
| 详情页 | 点标题→详情→内容+附件 |
| 数据权限隔离 | 不同部门用户只看到本部门公告 |

---

## 7. 新增依赖

### 后端

| 依赖 | 版本 | 用途 |
|------|------|------|
| `springdoc-openapi-starter-webmvc-api` | 2.8.0 | OpenAPI 生成 |
| `com.alibaba:easyexcel` | 4.0.+ | Excel 导出（流式写入低内存） |
| `spring-boot-starter-websocket` | 随 Boot | WebSocket + STOMP |
| `spring-boot-starter-mail` | 随 Boot | 邮件发送 |
| `spring-boot-starter-thymeleaf` | 随 Boot | 邮件 HTML 模板 |
| `weixin-java-mp` (WxJava) | 4.6.+ | 微信公众号 API |
| `weixin-java-miniapp` (WxJava) | 4.6.+ | 微信小程序 API |

WxJava 是 Java 生态最成熟的微信 SDK（GitHub 30k+ stars，支持公众号/小程序/企业微信，Spring Boot starter 开箱即用）。

### 前端

| 依赖 | 包 | 用途 |
|------|-----|------|
| `@openapitools/openapi-generator-cli` | 根 devDep | OpenAPI 代码生成 |
| `@tiptap/react` + `@tiptap/starter-kit` + extensions | web-admin | 富文本编辑 |
| `dompurify` + `@types/dompurify` | web-admin | HTML 净化 |
| `sockjs-client` + `@stomp/stompjs` | app-shell | WebSocket 客户端 |

---

## 8. 开发顺序

```
Phase 1: OpenAPI 管线
  ├── 后端 springdoc 配置
  ├── openapi.json 首次生成
  ├── 前端 openapi-generator 配置
  ├── api-sdk 重构（generated/ 替代手写 types/）
  └── 验证：check:types 通过

Phase 2: Notice 后端
  ├── DDL + jOOQ codegen
  ├── Repository + Service + Controller
  ├── 附件集成（platform-file）
  ├── @OperationLog 集成
  ├── Excel 导出（EasyExcel）
  ├── DataScopeConfig 注册
  ├── package-info.java + ArchUnit
  └── 集成测试（15 用例）

Phase 3: WebSocket 基础设施
  ├── 后端 infra-websocket（配置 + 认证 + session 管理 + sender API）
  ├── 前端 L4 websocket 子模块（useWebSocket + useWsSubscription）
  └── 验证：建连 + 心跳 + 认证 + 消息收发

Phase 4: 通知渠道系统
  ├── 渠道抽象（NotificationChannel 接口 + dispatcher）
  ├── InAppChannel（站内信 + WS 推送）
  ├── EmailChannel（JavaMailSender + Thymeleaf）
  ├── WeChatMpChannel（WxJava 公众号模板消息）
  ├── WeChatMiniChannel（WxJava 小程序订阅消息）
  ├── 微信绑定表 + 绑定 API
  ├── 发送记录表 + 查询 API
  └── Notice publish → NotificationDispatcher 串联

Phase 5: Notice 前端
  ├── 路由 + 权限声明
  ├── i18n 字典
  ├── 列表页（NxTable + NxFilter + NxBar + 导出）
  ├── 新增/编辑（NxDrawer + NxForm + TipTap + 附件上传）
  ├── 详情页（富文本渲染 + 附件下载 + 状态操作）
  └── WebSocket 集成（公告推送 toast + 踢人下线 + 权限刷新）

Phase 6: 实时能力 + E2E
  ├── 踢人下线（admin UI + 后端 API + WS 推送 + 前端处理）
  ├── 权限变更推送
  ├── 系统广播
  ├── Playwright E2E 测试
  └── 全量质量门禁
```

---

## 9. 质量标准（ADR-0006 P0 对标）

| P0 维度 | 满足方式 |
|---------|---------|
| P0.1 12 步清单 | 严格逐步执行，每步有 commit |
| P0.2 HikariCP | 复用 M4 配置 |
| P0.3 缓存 | 详情缓存 `mb:notice:detail:{id}`，mutation evict |
| P0.4 定时任务 | 可选：到期自动下架（@Scheduled + ShedLock） |
| P0.5 文件存储 | 附件通过 platform-file |
| P0.6 操作日志 | @OperationLog 全覆盖 |
