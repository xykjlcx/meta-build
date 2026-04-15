# M1-M4 审查修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 M1-M4 红蓝对抗审查发现的 9 Critical + 19 Major + 15 Minor 问题，确保 M5 前底座稳固。

**Architecture:** 分 5 批：数据库层（FK + CHECK + 索引 + 表名）→ 后端 Critical → 后端 Major/Minor → 前端 Critical → 前端 Major/Minor。后端和前端批次可并行（目录隔离）。每批结束后 `mvn verify` 或 `pnpm build && pnpm test` 验证。

**Tech Stack:** PostgreSQL 16 + Flyway + jOOQ codegen + Spring Boot 3.5.3 + Sa-Token + React 19 + TypeScript + TanStack Router/Query

---

## 文件结构概览

### 数据库层
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_001__add_foreign_keys.sql`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_002__add_check_constraints.sql`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_003__add_reverse_indexes.sql`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_004__rename_oplog_to_log.sql`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_005__fix_init_data.sql`

### 后端
- Create: `docs/adr/0013-oplog改名platform-log加注解下沉.md`
- Modify: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/MbJooqAutoConfiguration.java`
- Modify: `server/mb-common/src/main/java/com/metabuild/common/security/AuthFacade.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/log/OperationLog.java`（注解下沉）
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/auth/AuthService.java`
- Create: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/api/cmd/ResetPasswordCmd.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/web/UserController.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/auth/PasswordPolicy.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/dept/DeptService.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/role/RoleService.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/user/UserService.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/user/UserRepository.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/role/RoleRepository.java`
- Modify: `server/mb-infra/infra-captcha/src/main/java/com/metabuild/infra/captcha/CaptchaService.java`
- Modify: `server/mb-infra/infra-captcha/src/main/java/com/metabuild/infra/captcha/CaptchaController.java`
- Modify: `server/mb-infra/infra-rate-limit/src/main/java/com/metabuild/infra/ratelimit/RateLimitInterceptor.java`
- Modify: `server/mb-platform/platform-oplog/...`（重命名为 platform-log）
- Modify: `server/mb-platform/platform-file/src/main/java/com/metabuild/platform/file/domain/FileService.java`
- Modify: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/TraceIdFilter.java`

### 前端
- Modify: `client/apps/web-admin/src/routes/_authed.tsx`
- Modify: `client/apps/web-admin/src/main.tsx`
- Modify: `client/packages/ui-patterns/src/nx-filter.tsx`
- Modify: `client/packages/ui-patterns/src/api-select.tsx`
- Modify: `client/packages/api-sdk/src/http-client.ts`
- Modify: `client/packages/app-shell/src/components/sidebar.tsx`
- Modify: `client/packages/app-shell/src/auth/use-current-user.ts`
- Modify: `client/packages/app-shell/src/auth/require-auth.ts`
- Modify: `client/packages/ui-patterns/src/nx-tree.tsx`

---

## Task 1: 数据库 — 外键约束

**Files:**
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_001__add_foreign_keys.sql`

- [ ] **Step 1: 创建 FK migration 文件**

```sql
-- =============================================================
-- V20260414_001__add_foreign_keys.sql
-- 全表补 FK：核心表 RESTRICT，弱关联 SET NULL
-- =============================================================

-- iam_user → iam_dept
ALTER TABLE mb_iam_user
    ADD CONSTRAINT fk_iam_user_dept
    FOREIGN KEY (dept_id) REFERENCES mb_iam_dept(id)
    ON DELETE RESTRICT;

-- iam_dept → iam_dept（自引用，parent_id）
ALTER TABLE mb_iam_dept
    ADD CONSTRAINT fk_iam_dept_parent
    FOREIGN KEY (parent_id) REFERENCES mb_iam_dept(id)
    ON DELETE RESTRICT;

-- iam_dept → iam_user（leader_user_id）
ALTER TABLE mb_iam_dept
    ADD CONSTRAINT fk_iam_dept_leader
    FOREIGN KEY (leader_user_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- iam_user_role → iam_user
ALTER TABLE mb_iam_user_role
    ADD CONSTRAINT fk_iam_user_role_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE CASCADE;

-- iam_user_role → iam_role
ALTER TABLE mb_iam_user_role
    ADD CONSTRAINT fk_iam_user_role_role
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id)
    ON DELETE CASCADE;

-- iam_role_menu → iam_role
ALTER TABLE mb_iam_role_menu
    ADD CONSTRAINT fk_iam_role_menu_role
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id)
    ON DELETE CASCADE;

-- iam_role_menu → iam_menu
ALTER TABLE mb_iam_role_menu
    ADD CONSTRAINT fk_iam_role_menu_menu
    FOREIGN KEY (menu_id) REFERENCES mb_iam_menu(id)
    ON DELETE CASCADE;

-- iam_role_data_scope_dept → iam_role
ALTER TABLE mb_iam_role_data_scope_dept
    ADD CONSTRAINT fk_iam_role_dsd_role
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id)
    ON DELETE CASCADE;

-- iam_role_data_scope_dept → iam_dept
ALTER TABLE mb_iam_role_data_scope_dept
    ADD CONSTRAINT fk_iam_role_dsd_dept
    FOREIGN KEY (dept_id) REFERENCES mb_iam_dept(id)
    ON DELETE CASCADE;

-- iam_password_history → iam_user
ALTER TABLE mb_iam_password_history
    ADD CONSTRAINT fk_iam_password_history_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE CASCADE;

-- iam_login_log → iam_user（弱关联，用户删除后日志保留）
ALTER TABLE mb_iam_login_log
    ADD CONSTRAINT fk_iam_login_log_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- dict_data → dict_type
ALTER TABLE mb_dict_data
    ADD CONSTRAINT fk_dict_data_dict_type
    FOREIGN KEY (dict_type_id) REFERENCES mb_dict_type(id)
    ON DELETE RESTRICT;

-- file_metadata → iam_user（uploader）
ALTER TABLE mb_file_metadata
    ADD CONSTRAINT fk_file_metadata_uploader
    FOREIGN KEY (uploader_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- notification → iam_user（sender）
ALTER TABLE mb_notification
    ADD CONSTRAINT fk_notification_sender
    FOREIGN KEY (sender_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- notification_read → notification
ALTER TABLE mb_notification_read
    ADD CONSTRAINT fk_notification_read_notification
    FOREIGN KEY (notification_id) REFERENCES mb_notification(id)
    ON DELETE CASCADE;

-- notification_read → iam_user
ALTER TABLE mb_notification_read
    ADD CONSTRAINT fk_notification_read_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE CASCADE;

-- operation_log → iam_user（弱关联）
ALTER TABLE mb_operation_log
    ADD CONSTRAINT fk_operation_log_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- job_log 不加 FK（独立调度记录，无用户关联）
```

**注意**：`dept.parent_id` 的初始值 `0` 不引用任何行，需要先将根部门的 `parent_id` 从 `0` 改为 `NULL`，然后才能加自引用 FK。同理 `user.dept_id` 可能有 `0` 值。实施时需要在 FK 语句前加 UPDATE 修正：

```sql
-- ==============================
-- 第一步：DROP NOT NULL（必须在 UPDATE NULL 之前，否则 NOT NULL 约束拒绝写入 NULL）
-- ==============================
ALTER TABLE mb_iam_dept ALTER COLUMN parent_id DROP NOT NULL;
ALTER TABLE mb_file_metadata ALTER COLUMN uploader_id DROP NOT NULL;
ALTER TABLE mb_operation_log ALTER COLUMN user_id DROP NOT NULL;
-- mb_iam_login_log.user_id 本就没有 NOT NULL 约束，无需 ALTER（Codex I-6）

-- ==============================
-- 第二步：修正 0→NULL 占位值
-- ==============================
UPDATE mb_iam_dept SET parent_id = NULL WHERE parent_id = 0;
UPDATE mb_iam_user SET dept_id = NULL WHERE dept_id = 0;
UPDATE mb_iam_dept SET leader_user_id = NULL WHERE leader_user_id = 0;
UPDATE mb_file_metadata SET uploader_id = NULL WHERE uploader_id = 0;
UPDATE mb_operation_log SET user_id = NULL WHERE user_id = 0;
UPDATE mb_notification SET sender_id = NULL WHERE sender_id = 0;
```

将这些 UPDATE + ALTER COLUMN 放在 FK ALTER TABLE 之前。

**RC-7 补充**：route_tree 和 menu 也有自引用 parent_id，需要加 FK：

```sql
-- iam_route_tree → iam_route_tree（自引用）
ALTER TABLE mb_iam_route_tree ALTER COLUMN parent_id DROP NOT NULL;
UPDATE mb_iam_route_tree SET parent_id = NULL WHERE parent_id = 0;
ALTER TABLE mb_iam_route_tree
    ADD CONSTRAINT fk_iam_route_tree_parent
    FOREIGN KEY (parent_id) REFERENCES mb_iam_route_tree(id)
    ON DELETE CASCADE;

-- iam_menu → iam_menu（自引用）
ALTER TABLE mb_iam_menu ALTER COLUMN parent_id DROP NOT NULL;
UPDATE mb_iam_menu SET parent_id = NULL WHERE parent_id = 0;
ALTER TABLE mb_iam_menu
    ADD CONSTRAINT fk_iam_menu_parent
    FOREIGN KEY (parent_id) REFERENCES mb_iam_menu(id)
    ON DELETE CASCADE;
```

**RI-7 说明**：`owner_dept_id` 不加 FK——此字段是数据权限快照字段，记录操作时的归属部门，不应因部门重组而级联变化。

- [ ] **Step 2: 同步修改 Java 代码中的"0L 代替 NULL"模式**

涉及文件（所有 `setXxx(0L)` 改为 `setXxx(null)`，因为 FK 要求引用值要么是实际 ID 要么是 NULL）：

**parent_id 类（自引用 FK）**：
- `DeptService.java:48` — `setParentId(0L)` → `setParentId(null)`
- `MenuService.java:70` — `setParentId(0L)` → `setParentId(null)`（Codex 审查补充）

**uploaderId / userId 类（弱关联 FK）**：
- `FileService.java:118` — `setUploaderId(0L)` → 改为实际用户 ID 或 null
- `OperationLogAspect.java:82-89` — userId 为 0 时改为 null

**注意**：`owner_dept_id` 是数据权限快照字段，**不加 FK**，保持 `0L` 作为"无归属"语义不变。`DeptService.java:53`、`RoleService.java:67`、`DictService.java:70`、`NotificationService.java:59` 的 `setOwnerDeptId(0L)` **不改**。

- [ ] **Step 3: 运行 Flyway 迁移验证**

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

Expected: migration 成功，jOOQ codegen 重新生成。

- [ ] **Step 4: 提交**

```bash
git add server/mb-schema/src/main/resources/db/migration/V20260414_001__add_foreign_keys.sql
git commit -m "fix(schema): 全表补 FK 约束（核心表 RESTRICT，弱关联 SET NULL）"
```

---

## Task 2: 数据库 — CHECK 约束 + 反向索引 + init_data 修复

**Files:**
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_002__add_check_constraints.sql`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_003__add_reverse_indexes.sql`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_005__fix_init_data.sql`

- [ ] **Step 1: 创建 CHECK 约束 migration**

```sql
-- V20260414_002__add_check_constraints.sql

-- iam_role.data_scope
ALTER TABLE mb_iam_role
    ADD CONSTRAINT chk_iam_role_data_scope
    CHECK (data_scope IN ('ALL', 'OWN_DEPT', 'OWN_DEPT_AND_CHILD', 'CUSTOM_DEPT', 'SELF'));

-- iam_route_tree.route_type
ALTER TABLE mb_iam_route_tree
    ADD CONSTRAINT chk_iam_route_tree_route_type
    CHECK (route_type IN ('LAYOUT', 'PAGE', 'MENU', 'BUTTON', 'EXTERNAL'));

-- iam_menu.menu_type
ALTER TABLE mb_iam_menu
    ADD CONSTRAINT chk_iam_menu_menu_type
    CHECK (menu_type IN ('DIRECTORY', 'MENU', 'BUTTON'));

-- notification.type
ALTER TABLE mb_notification
    ADD CONSTRAINT chk_notification_type
    CHECK (type IN ('SYSTEM', 'BUSINESS', 'APPROVAL'));

-- notification.status
ALTER TABLE mb_notification
    ADD CONSTRAINT chk_notification_status
    CHECK (status IN (0, 1, 2));

-- config.config_type
ALTER TABLE mb_config
    ADD CONSTRAINT chk_config_config_type
    CHECK (config_type IN ('SYSTEM', 'BUSINESS'));

-- job_log.status
ALTER TABLE mb_job_log
    ADD CONSTRAINT chk_job_log_status
    CHECK (status IN ('SUCCESS', 'FAILURE', 'RUNNING'));

-- iam_user.status / iam_role.status / iam_dept.status（通用：0=停用 1=正常）
ALTER TABLE mb_iam_user
    ADD CONSTRAINT chk_iam_user_status CHECK (status IN (0, 1));
ALTER TABLE mb_iam_role
    ADD CONSTRAINT chk_iam_role_status CHECK (status IN (0, 1));
ALTER TABLE mb_iam_dept
    ADD CONSTRAINT chk_iam_dept_status CHECK (status IN (0, 1));
```

**注意**：以上枚举值需要与实际 DDL 和 Java 代码中的值对齐。实施时先 `grep` 确认每个字段的实际使用值。

- [ ] **Step 2: 创建反向索引 migration**

```sql
-- V20260414_003__add_reverse_indexes.sql

-- user_role 按 role_id 反向查询
CREATE INDEX idx_iam_user_role_role_id ON mb_iam_user_role(role_id);

-- role_menu 按 menu_id 反向查询
CREATE INDEX idx_iam_role_menu_menu_id ON mb_iam_role_menu(menu_id);

-- role_data_scope_dept 按 dept_id 反向查询
CREATE INDEX idx_iam_role_dsd_dept_id ON mb_iam_role_data_scope_dept(dept_id);

-- notification_read 按 user_id 查询（"我的已读通知"）
CREATE INDEX idx_notification_read_user_id ON mb_notification_read(user_id, read_at DESC);
```

- [ ] **Step 3: 修复 init_data**

```sql
-- V20260414_005__fix_init_data.sql
-- 确保 init data 的 INSERT 在 UPDATE 之前存在

-- 如果 id=1 用户不存在则插入默认管理员（幂等）
INSERT INTO mb_iam_user (id, username, password_hash, status, must_change_password, owner_dept_id, created_by, updated_by, version)
VALUES (1, 'admin', '$2a$10$placeholder', 1, true, NULL, 1, 1, 0)
ON CONFLICT (id) DO NOTHING;
```

**注意**：需要先读取现有 `V20260604_001__init_data.sql` 确认其具体内容，然后写补丁。

- [ ] **Step 4: 运行 Flyway + codegen 验证**

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema && mvn verify
```

- [ ] **Step 5: 提交**

```bash
git add server/mb-schema/src/main/resources/db/migration/V20260414_002__add_check_constraints.sql
git add server/mb-schema/src/main/resources/db/migration/V20260414_003__add_reverse_indexes.sql
git add server/mb-schema/src/main/resources/db/migration/V20260414_005__fix_init_data.sql
git commit -m "fix(schema): CHECK 约束 + 反向索引 + init_data 幂等修复"
```

---

## Task 3: 后端 C-1 — jOOQ ExecuteListener 互相覆盖

**Files:**
- Modify: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/MbJooqAutoConfiguration.java`

- [ ] **Step 1: 改为直接注册 ExecuteListenerProvider Bean（RC-5）**

删除两个 `DefaultConfigurationCustomizer` Bean（`slowQueryListenerCustomizer` + `dataScopeExecuteListenerCustomizer`），改为直接注册 `ExecuteListenerProvider` Bean。Spring Boot 的 `JooqAutoConfiguration` 会自动收集所有 `ExecuteListenerProvider` Bean 并注册到 Configuration 中（与其内置的 `JooqExceptionTranslatorExecuteListener` 共存，不会互相覆盖）。

```java
// 删除 slowQueryListenerCustomizer 和 dataScopeExecuteListenerCustomizer

// 替换为两个独立的 ExecuteListenerProvider Bean：
@Bean
public ExecuteListenerProvider slowQueryListenerProvider(SlowQueryListener listener) {
    return new DefaultExecuteListenerProvider(listener);
}

@Bean
public ExecuteListenerProvider dataScopeListenerProvider(DataScopeVisitListener listener) {
    return new DefaultExecuteListenerProvider(listener);
}
```

保留 `auditFieldsRecordListenerCustomizer`（RecordListener，不受影响）。

- [ ] **Step 2: 写集成测试验证两个 listener 同时生效**

在 `mb-admin` 的测试中新增一个测试方法，验证 jOOQ Configuration 中注册了 ≥2 个 ExecuteListenerProvider：

```java
@Test
void jooqShouldHaveBothExecuteListeners() {
    var providers = dslContext.configuration().executeListenerProviders();
    // 至少包含 SlowQueryListener 和 DataScopeVisitListener
    assertThat(providers.length).isGreaterThanOrEqualTo(2);
    var listenerTypes = Arrays.stream(providers)
        .map(p -> p.provide().getClass().getSimpleName())
        .toList();
    assertThat(listenerTypes).contains("SlowQueryListener", "DataScopeVisitListener");
}
```

- [ ] **Step 3: 运行测试**

```bash
cd server && mvn verify
```

- [ ] **Step 4: 提交**

```bash
git commit -m "fix(infra-jooq): 合并 ExecuteListener 注册，修复互相覆盖 bug（C-1）"
```

---

## Task 4: 后端 C-2 + C-3 + C-4 + C-9 — Critical 修复

**Files:**
- Create: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/api/cmd/ResetPasswordCmd.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/web/UserController.java:73`
- Modify: `server/mb-common/src/main/java/com/metabuild/common/security/AuthFacade.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/auth/AuthService.java:156-161`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/auth/PasswordPolicy.java:51-53`
- Modify: `server/mb-infra/infra-captcha/src/main/java/com/metabuild/infra/captcha/CaptchaService.java:32`

- [ ] **Step 1: C-2 — resetPassword DTO 化**

创建 `ResetPasswordCmd.java`：

```java
package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordCmd(
    @NotBlank String newPassword
) {}
```

修改 `UserController.java:73`：

```java
@PostMapping("/{id}/reset-password")
@RequirePermission("iam:user:resetPassword")
public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordCmd request) {
    userService.resetPassword(id, request.newPassword());
}
```

- [ ] **Step 2: C-3 — AuthFacade 门面泄漏修复（RC-4 修正）**

**问题**：`AuthService.refresh()` 中 `instanceof SaTokenAuthFacade` 违反门面模式。但不能简单改为 `authFacade.refresh(refreshToken)`——当前 `SaTokenAuthFacade.refresh()` 返回空壳 LoginResult（无 accessToken/refreshToken），因为它不知道业务层的 SessionData 构建逻辑。

**正确修复**：在 `AuthFacade` 接口中新增职责更窄的方法，将 refresh 拆为两步：

1. `AuthFacade` 接口新增：`Long validateAndRotateRefreshToken(String refreshToken)` — 只验证 refreshToken 有效性并轮转，返回 userId
2. `SaTokenAuthFacade` 实现此方法：调 `RefreshTokenService.validateAndRotate()`，返回 userId
3. `AuthService.refresh()` 改为：
   ```java
   @Transactional
   public LoginResult refresh(String refreshToken) {
       Long userId = authFacade.validateAndRotateRefreshToken(refreshToken);
       // 重建 SessionData（业务逻辑留在 AuthService）
       var user = userRepository.findById(userId)
           .orElseThrow(() -> new NotFoundException("iam.user.notFound", userId));
       var permissions = menuRepository.findPermissionsByUserId(userId);
       var sessionData = new SessionData(user.getId(), user.getUsername(), /* ... */);
       return authFacade.doLogin(userId, sessionData); // 复用 doLogin 生成新 token pair
   }
   ```
4. 删除 `AuthFacade.refresh(String refreshToken)` 旧方法（或标 @Deprecated）
5. 删除 `AuthService` 中的 `instanceof SaTokenAuthFacade` 代码

- [ ] **Step 3: C-4 — PasswordPolicy 注入 Clock**

修改 `PasswordPolicy.java`：

```java
@RequiredArgsConstructor
public class PasswordPolicy {

    private final MbIamPasswordProperties props;
    private final Clock clock;

    public boolean isExpired(OffsetDateTime passwordUpdatedAt) {
        if (props.maxAgeDays() == 0) return false;
        return passwordUpdatedAt.plusDays(props.maxAgeDays()).isBefore(OffsetDateTime.now(clock));
    }
    // ... 其余不变
}
```

同步修改创建 `PasswordPolicy` Bean 的配置类，增加 `Clock` 注入。

- [ ] **Step 4: C-9 — CaptchaService Random → SecureRandom**

修改 `CaptchaService.java:32`：

```java
import java.security.SecureRandom;

private static final SecureRandom RANDOM = new SecureRandom();
```

- [ ] **Step 5: 运行测试**

```bash
cd server && mvn verify
```

- [ ] **Step 6: 提交**

```bash
git commit -m "fix(iam): resetPassword DTO 化 + AuthFacade 门面泄漏 + Clock 注入 + SecureRandom（C-2/C-3/C-4/C-9）"
```

---

## Task 5: 后端 Major 修复（M-1 ~ M-9）

**Files:**
- Modify: `server/mb-platform/platform-oplog/src/main/java/com/metabuild/platform/oplog/domain/OperationLogAspect.java:100`
- Modify: `server/mb-infra/infra-rate-limit/src/main/java/com/metabuild/infra/ratelimit/RateLimitInterceptor.java:35`
- Modify: `server/mb-platform/platform-file/src/main/java/com/metabuild/platform/file/domain/FileService.java:39`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/user/UserRepository.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/role/RoleRepository.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/dept/DeptService.java`
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/dept/DeptRepository.java`（Codex I-3 补充）
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/menu/MenuRepository.java`（Codex I-3 补充）
- Modify: `server/mb-platform/platform-iam/src/main/java/com/metabuild/platform/iam/domain/role/RoleService.java`
- Modify: `server/mb-admin/src/main/resources/application.yml`（Codex I-4：补 forward-headers-strategy）

- [ ] **Step 1: M-1 — OperationLogAspect Clock 注入**

```java
// 注入 Clock
private final Clock clock;

// 第 100 行：
record.setCreatedAt(OffsetDateTime.now(clock));
```

- [ ] **Step 2: M-2 — RateLimitInterceptor 换 Caffeine 缓存**

```java
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

// 替换第 35 行的 ConcurrentHashMap：
private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterAccess(Duration.ofMinutes(10))
    .build();

// computeIfAbsent 改为：
Bucket bucket = buckets.get(bucketKey, k -> buildBucket(qps));
```

需要在 `infra-rate-limit/pom.xml` 中添加 caffeine 依赖（Spring Boot 已管理版本）：

```xml
<dependency>
    <groupId>com.github.benmanes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
```

- [ ] **Step 3: M-4 — FileService 扩展名白名单配置化**

将硬编码的 `ALLOWED_EXTENSIONS` 移到 `MbFileProperties`：

```java
// MbFileProperties 新增：
// List<String> allowedExtensions()  // 默认 ["jpg","jpeg","png","gif","webp","pdf","zip","json"]

// FileService.java 修改 validateExtension：
private void validateExtension(String filename) {
    String ext = "";
    int dotIdx = filename.lastIndexOf('.');
    if (dotIdx >= 0) {
        ext = filename.substring(dotIdx + 1).toLowerCase();
    }
    if (!properties.allowedExtensions().contains(ext)) {
        throw new IllegalArgumentException("不允许的文件扩展名: " + ext);
    }
}
```

- [ ] **Step 4: M-5 — 乐观锁模式改进**

修改 `UserRepository.update()`（以及 `RoleRepository.update()`、`DeptRepository.update()`）的乐观锁模式：

Repository 层自己管 version 递增，不依赖 Service 层提前 +1：

```java
// UserRepository.java — update 方法
public int update(MbIamUserRecord record) {
    int originalVersion = record.getVersion() - 1; // Service 已经 +1 了
    // 改为：传入 originalVersion 参数，或者 Repository 层自己处理
}
```

**更好的方案**：Service 层不再做 `record.setVersion(record.getVersion() + 1)`，改为 Repository 层在 UPDATE SQL 中用 `VERSION = VERSION + 1` 并返回影响行数：

```java
// Repository
public int update(MbIamUserRecord record) {
    return dsl.update(MB_IAM_USER)
        .set(MB_IAM_USER.EMAIL, record.getEmail())
        // ... 其他字段
        .set(MB_IAM_USER.VERSION, MB_IAM_USER.VERSION.plus(1))
        .where(MB_IAM_USER.ID.eq(record.getId()))
        .and(MB_IAM_USER.VERSION.eq(record.getVersion()))
        .execute();
}
```

Service 层不再手动 `record.setVersion(record.getVersion() + 1)`。

**RI-1 注意**：改为 DSL UPDATE 后，`AuditFieldsRecordListener` 不再自动填充 `updated_by`/`updated_at`（它只拦截 Record-based 操作）。DSL UPDATE 中必须手动设置：

```java
    .set(MB_IAM_USER.UPDATED_BY, currentUser.userId())  // 从注入的 CurrentUser 获取
    .set(MB_IAM_USER.UPDATED_AT, OffsetDateTime.now(clock))
```

所有使用 DSL UPDATE 的 Repository 方法都需要加这两个字段。

- [ ] **Step 5: M-6 — DeptService/RoleService 补 Snowflake ID**

```java
// DeptService.createDept — 在 record.setParentId() 之前加：
record.setId(idGenerator.nextId());

// RoleService.createRole — 在 record.setName() 之前加：
record.setId(idGenerator.nextId());
```

需要在 `DeptService` 和 `RoleService` 中注入 `SnowflakeIdGenerator`。

- [ ] **Step 6: M-7 — RoleService.deleteRole 级联清理**

有了 FK + CASCADE，数据库会自动级联删除 `user_role` 和 `role_menu`。但显式清理更安全且意图清晰：

```java
@Transactional
public void deleteRole(Long id) {
    roleRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("iam.role.notFound", id));
    roleRepository.deleteUserRolesByRoleId(id);
    roleRepository.deleteRoleMenusByRoleId(id);
    roleRepository.deleteDataScopeDeptsByRoleId(id);
    roleRepository.deleteById(id);
    log.info("删除角色: roleId={}", id);
}
```

- [ ] **Step 7: M-8 — DeptService.deleteDept 检查用户引用**

```java
@Transactional
public void deleteDept(Long id) {
    deptRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("iam.dept.notFound", id));
    if (deptRepository.hasChildren(id)) {
        throw new BusinessException("iam.dept.hasChildren", 400);
    }
    if (deptRepository.hasUsers(id)) {
        throw new BusinessException("iam.dept.hasUsers", 400);
    }
    deptRepository.deleteById(id);
    log.info("删除部门: deptId={}", id);
}
```

`DeptRepository` 新增 `hasUsers(Long deptId)` 方法。

- [ ] **Step 8: RI-4 — RateLimitInterceptor X-Forwarded-For 不可信**

`RateLimitInterceptor` 直接读 `X-Forwarded-For` 头做限流 key，攻击者可伪造绕过限流。

修复：使用 `request.getRemoteAddr()` 作为默认 IP 源。如果部署在反向代理后面，配合 Spring Boot 的 `ForwardedHeaderFilter`（在 application.yml 中 `server.forward-headers-strategy=FRAMEWORK`），这样 `getRemoteAddr()` 会自动读代理传递的真实 IP。

```java
// 替换直接读 X-Forwarded-For 的代码：
String clientIp = request.getRemoteAddr();
```

- [ ] **Step 9: 运行测试**

```bash
cd server && mvn verify
```

- [ ] **Step 10: 提交**

```bash
git commit -m "fix: 后端 Major 修复（Clock/Caffeine 限流/乐观锁/SnowflakeID/级联删除/XFF）"
```

---

## Task 6: 后端 Minor 修复 + Captcha verify 删除

**Files:**
- Modify: `server/mb-platform/platform-file/src/main/java/com/metabuild/platform/file/domain/FileService.java:146,157`
- Modify: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/TraceIdFilter.java:36`
- Modify: `server/mb-infra/infra-captcha/src/main/java/com/metabuild/infra/captcha/CaptchaController.java`

- [ ] **Step 1: m-1 — FileService.delete 异常类型修正**

```java
// FileService.java:146 — SecurityException → ForbiddenException
import com.metabuild.common.exception.ForbiddenException;

throw new ForbiddenException("file.deleteNotAllowed");
```

- [ ] **Step 2: m-2 — FileService.findByIdWithTenantCheck 异常类型修正**

```java
// FileService.java:157 — NoSuchElementException → NotFoundException
import com.metabuild.common.exception.NotFoundException;

.orElseThrow(() -> new NotFoundException("file.notFound", fileId));
```

- [ ] **Step 3: m-3 — TraceIdFilter MDC.clear() → MDC.remove()**

```java
// TraceIdFilter.java:36
} finally {
    MDC.remove(MDC_TRACE_ID);
}
```

- [ ] **Step 4: m-6 — 删除 Captcha verify 端点**

从 `CaptchaController.java` 中删除 `verify` 方法和 `CaptchaVerifyRequest` record（第 40-53 行）。只保留 `generate` 端点。

- [ ] **Step 5: 运行测试**

```bash
cd server && mvn verify
```

- [ ] **Step 6: 提交**

```bash
git commit -m "fix: 后端 Minor 修复（异常类型/MDC/删除 captcha verify 端点）"
```

---

## Task 7: 后端 — platform-oplog 重命名为 platform-log + 注解下沉

**Files:**
- Create: `docs/adr/0013-oplog改名platform-log加注解下沉.md`
- Create: `server/mb-common/src/main/java/com/metabuild/common/log/OperationLog.java`
- Rename: `server/mb-platform/platform-oplog/` → `server/mb-platform/platform-log/`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260414_004__rename_oplog_to_log.sql`
- Modify: `server/mb-platform/pom.xml`
- Modify: 所有 platform-oplog 内部的 package 名

- [ ] **Step 1: 写 ADR-0013**

```markdown
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
```

- [ ] **Step 2: 注解下沉到 mb-common**

创建 `server/mb-common/src/main/java/com/metabuild/common/log/OperationLog.java`：

```java
package com.metabuild.common.log;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解，标注在 Controller 方法上。
 * 实现由 platform-log 模块的 OperationLogAspect 负责拦截和异步写入。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {
    /** 所属模块（如 "iam", "dict", "file"） */
    String module();
    /** 操作描述（如 "创建用户", "上传文件"） */
    String operation();
}
```

- [ ] **Step 3: 重命名 platform-oplog → platform-log**

1. `mv server/mb-platform/platform-oplog server/mb-platform/platform-log`
2. 修改 `server/mb-platform/platform-log/pom.xml`：`<artifactId>platform-log</artifactId>`
3. 修改 `server/mb-platform/pom.xml`：`<module>platform-oplog</module>` → `<module>platform-log</module>`
4. 修改 `server/pom.xml` 的 dependencyManagement 中 `platform-oplog` → `platform-log`（Codex 审查补充）
5. 修改 `server/mb-admin/pom.xml` 中的依赖引用
5. 重命名 Java 包：`com.metabuild.platform.oplog` → `com.metabuild.platform.log`
6. `OperationLogAspect.java` 的 `@Around` 注解引用改为 `@Around("@annotation(com.metabuild.common.log.OperationLog)")`
7. 删除 `platform-log` 内部的旧 `OperationLog.java` 注解文件
8. **Codex I-5**：`platform-job` 模块中 `OplogCleanupJob.java` 和 `OplogCleanupRepository.java` 引用了 `MB_OPERATION_LOG` 表常量，表名重命名后 jOOQ codegen 会生成新常量 `MB_LOG_OPERATION`，需要同步更新这两个文件的 import 和引用

- [ ] **Step 4: 表名重命名 migration（含索引重命名 RI-6）**

```sql
-- V20260414_004__rename_oplog_to_log.sql
ALTER TABLE mb_operation_log RENAME TO mb_log_operation;

-- RI-6: 同步重命名关联的索引和约束
ALTER INDEX IF EXISTS idx_operation_log_xxx RENAME TO idx_log_operation_xxx;
-- 实施时 grep 所有 mb_operation_log 相关索引名，逐一重命名
```

- [ ] **Step 4.5: 更新 Spring Boot 自动配置注册（RI-2）**

1. 修改 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 中的类路径（`platform.oplog` → `platform.log`）
2. 如果有 `@ComponentScan(basePackages = "com.metabuild.platform.oplog")` 需改为 `platform.log`
3. 检查 `mb-admin` 的 application.yml 中是否有 oplog 相关配置项

- [ ] **Step 5: jOOQ codegen + 全量验证**

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema && mvn verify
```

- [ ] **Step 6: grep 残留扫描**

```bash
grep -r "platform-oplog\|platform\.oplog\|mb_operation_log" server/ --include="*.java" --include="*.xml" --include="*.yml" --include="*.sql" | grep -v target/
```

Expected: 零结果（或仅在 ADR 历史文档中出现）。

- [ ] **Step 7: 提交**

```bash
git commit -m "refactor: platform-oplog → platform-log + @OperationLog 下沉 mb-common（ADR-0013）"
```

---

## Task 8: 前端 C-5 — _authed.tsx 权限守卫 TypeError

**Files:**
- Modify: `client/apps/web-admin/src/routes/_authed.tsx`

- [ ] **Step 1: 导入 toCurrentUser 并转换 DTO**

```tsx
import { authApi } from '@mb/api-sdk';
import { SidebarLayout, toCurrentUser } from '@mb/app-shell';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    try {
      const dto = await context.queryClient.ensureQueryData({
        queryKey: ['auth', 'me'],
        queryFn: () => authApi.getCurrentUser(),
        staleTime: 5 * 60_000,
      });
      return { currentUser: toCurrentUser(dto) };
    } catch {
      throw redirect({
        to: '/auth/login',
        search: { redirect: window.location.pathname },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
}
```

需要从 `@mb/app-shell` 导出 `toCurrentUser`。在 `use-current-user.ts` 中将 `toCurrentUser` 导出：

```typescript
// use-current-user.ts — 将 toCurrentUser 改为 export
export function toCurrentUser(dto: CurrentUserVo): CurrentUser {
```

并在 `@mb/app-shell` 的 barrel export 中加上 `toCurrentUser`。

同时修复 `location.pathname` → `window.location.pathname`（M-16）。

- [ ] **Step 2: 运行测试**

```bash
cd client && pnpm check:types && pnpm test
```

- [ ] **Step 3: 提交**

```bash
git commit -m "fix(web-admin): _authed beforeLoad 转换 DTO 为 CurrentUser，修复权限守卫 TypeError（C-5）"
```

---

## Task 9: 前端 C-6 — 401 硬跳转改 replace 并保留 redirect 参数

**Files:**
- Modify: `client/apps/web-admin/src/main.tsx:50-51`

- [ ] **Step 1: 改用 router.navigate**

问题：`onUnauthenticated` 在 `configureApiSdk` 时调用，此时 router 已创建。改为：

```typescript
onUnauthenticated: () => {
  // 保留当前路径作为 redirect 参数
  const currentPath = window.location.pathname + window.location.search;
  // SPA 内跳转，保留 React 状态
  window.location.replace(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
},
```

**说明**：`configureApiSdk` 必须在 `createAppRouter` 之前执行（因为 beforeLoad 调用 authApi），所以无法用 `router.navigate()`。`window.location.replace()` 比 `window.location.href =` 好——replace 不会在 history 中留下当前页面（避免用户后退到一个 401 页面）。

- [ ] **Step 2: 运行测试**

```bash
cd client && pnpm check:types && pnpm build
```

- [ ] **Step 3: 提交**

```bash
git commit -m "fix(web-admin): 401 onUnauthenticated 改用 replace 并携带 redirect 参数（C-6）"
```

---

## Task 10: 前端 C-7 — NxFilter handleReset 类型不兼容

**Files:**
- Modify: `client/packages/ui-patterns/src/nx-filter.tsx:93-98`

- [ ] **Step 1: 要求调用方传入 defaultValue**

在 `NxFilterProps` 中新增 `defaultValue: TFilter`，reset 时用 defaultValue 而非构造空字符串：

```tsx
export interface NxFilterProps<TFilter extends NxFilterValue> {
  value: TFilter;
  /** 重置时恢复到的默认值 */
  defaultValue: TFilter;
  onChange: (next: TFilter) => void;
  resetLabel: ReactNode;
  applyLabel: ReactNode;
  children: ReactNode;
  className?: string;
}

// handleReset:
const handleReset = useCallback(() => {
  setDraft({ ...defaultValue });
  onChange({ ...defaultValue });
}, [defaultValue, onChange]);
```

- [ ] **Step 2: 更新测试和 Storybook story**

确保 NxFilter 的测试传入 `defaultValue` 参数。

- [ ] **Step 3: 运行测试**

```bash
cd client && pnpm -F @mb/ui-patterns test && pnpm check:types
```

- [ ] **Step 4: 提交**

```bash
git commit -m "fix(ui-patterns): NxFilter reset 使用 defaultValue 而非空字符串（C-7）"
```

---

## Task 11: 前端 Major 修复（M-9 ~ M-16）

**Files:**
- Modify: `client/packages/ui-patterns/src/api-select.tsx:116`
- Modify: `client/packages/api-sdk/src/http-client.ts:64`
- Modify: `client/packages/app-shell/src/components/sidebar.tsx:42`
- Modify: `client/packages/app-shell/src/auth/use-current-user.ts:26-33`
- Modify: `client/packages/ui-patterns/src/nx-tree.tsx:118`
- Modify: `client/packages/app-shell/src/auth/require-auth.ts:25`

- [ ] **Step 1: M-9 — ApiSelect fetcher 稳定引用**

用 `useRef` 存最新 fetcher，避免箭头函数引用变化导致重复请求：

```tsx
// api-select.tsx
const fetcherRef = useRef(fetcher);
fetcherRef.current = fetcher;

useEffect(() => {
  if (!open) return;
  const currentId = ++fetchIdRef.current;
  setLoading(true);

  fetcherRef.current({ keyword: debouncedKeyword, page: 1, size })
    .then((result) => { /* ... */ })
    // ...
}, [open, debouncedKeyword, size]); // fetcher 从依赖中移除
```

- [ ] **Step 2: M-10 — http-client 204 返回类型安全**

```typescript
// http-client.ts:64
if (response.status === 204) return undefined as unknown as T;
```

这仍然不完美，但更诚实。更好的方案是让调用方显式声明 `Promise<void>`，而 `request<void>` 的 204 路径返回 `undefined` 是安全的。当前实现对 `void` 类型无害，保持现状并添加注释即可：

```typescript
if (response.status === 204) {
  // 204 No Content — 调用方应声明 Promise<void>
  return undefined as T;
}
```

- [ ] **Step 3: M-11 — Sidebar 过滤 visible:false 菜单**

```tsx
// sidebar.tsx — 渲染菜单树前过滤
const visibleTree = data?.tree?.filter((node) => node.visible !== false) ?? [];
// 递归渲染子节点时也过滤
```

- [ ] **Step 4: M-12 — useCurrentUser 区分未登录和网络错误**

```typescript
export function useCurrentUser(): CurrentUser {
  const { data, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: 1, // 允许重试一次（网络抖动）
    throwOnError: false,
  });

  if (error) {
    // 401 → 真的未登录；其他错误 → 网络问题，仍返回 ANONYMOUS 但 log 警告
    if (error instanceof ProblemDetailError && error.status === 401) {
      return ANONYMOUS;
    }
    console.warn('[useCurrentUser] 获取用户信息失败，非 401 错误:', error.message);
  }

  return data ? toCurrentUser(data) : ANONYMOUS;
}
```

- [ ] **Step 5: M-15 — NxTree 默认参数避免新 Set**

```tsx
// nx-tree.tsx — 模块级常量
const EMPTY_SET: ReadonlySet<string> = new Set();

// props 默认值：
expandedIds = EMPTY_SET
```

- [ ] **Step 6: M-16 — require-auth.ts 裸 location 修复**

```typescript
// require-auth.ts:25
throw redirect({ to: '/auth/login', search: { redirect: window.location.pathname } });
```

- [ ] **Step 7: 运行全量测试**

```bash
cd client && pnpm check:types && pnpm test && pnpm build
```

- [ ] **Step 8: 提交**

```bash
git commit -m "fix(client): 前端 Major 修复（ApiSelect/Sidebar/useCurrentUser/NxTree/require-auth）"
```

---

## Task 12: 前端 Minor 修复

**Files:**
- Modify: `client/packages/ui-patterns/src/api-select.tsx:138`
- Modify: `client/apps/web-admin/src/mock/handlers.ts`

- [ ] **Step 1: m-8 — ApiSelect aria-controls 动态 ID**

```tsx
// api-select.tsx — 组件顶部
const listboxId = useRef(`api-select-listbox-${Math.random().toString(36).slice(2, 8)}`);

// 第 138 行：
aria-controls={listboxId.current}

// CommandList 上也加 id：
<CommandList id={listboxId.current}>
```

更好的方案是用 React 19 的 `useId()`：

```tsx
const listboxId = useId();
```

- [ ] **Step 2: m-9 — MSW mock ALL_PERMISSIONS 补全**

从 `@mb/api-sdk` 导入完整权限列表，替换手写的本地 `ALL_PERMISSIONS` 数组：

```typescript
// mock/handlers.ts — 删除本地 ALL_PERMISSIONS 数组
import { ALL_APP_PERMISSIONS } from '@mb/api-sdk';

// 使用处改为 ALL_APP_PERMISSIONS
permissions: ALL_APP_PERMISSIONS,
```

- [ ] **Step 3: 运行测试**

```bash
cd client && pnpm test && pnpm check:types
```

- [ ] **Step 4: 提交**

```bash
git commit -m "fix(client): 前端 Minor 修复（aria-controls 动态 ID / MSW 权限补全）"
```

---

## Task 13: 文档更新 — CLAUDE.md + handoff

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/adr/` 索引

- [ ] **Step 1: 更新 CLAUDE.md**

1. handoff 列表补全 m1-complete 和 m4-complete
2. 测试数量 "267 tests" → 实际值
3. api-sdk 测试 "15 tests" → 实际值
4. ADR 索引表加上 ADR-0013

- [ ] **Step 1.5: RI-3 — 更新 specs 中的 12 步清单模板**

`docs/specs/backend/03-platform-modules.md` 中的 12 步清单是 AI 生成业务模块的模板。本轮修复涉及的模式变化需要同步更新：
1. 乐观锁模式：DSL UPDATE + VERSION + 1，不要 Record-based +1/-1
2. DSL UPDATE 必须手动设置 updated_by/updated_at
3. FK 约束已全量添加，新模块 DDL 模板中体现 FK 声明
4. 所有 ID 字段用 Snowflake，不要依赖数据库自增

- [ ] **Step 1.6: RI-5 — Actuator 安全加固**

检查 `application.yml` / `application-prod.yml` 中 Actuator 端点配置：
1. 生产环境禁用 `loggers` endpoint（可被用于运行时修改日志级别）
2. 建议配置：`management.endpoints.web.exposure.include: health,info,metrics,prometheus`
3. 不暴露 `env`、`beans`、`configprops` 等敏感端点

- [ ] **Step 2: 运行前后端验证**

```bash
cd server && mvn verify
cd client && pnpm build && pnpm test && pnpm check:types
```

- [ ] **Step 3: 提交**

```bash
git commit -m "docs: 更新 CLAUDE.md（handoff 列表/测试数量/ADR-0013）"
```

---

## 执行顺序和并行策略

```
Phase 1: 数据库（串行）
  Task 1 (FK) → Task 2 (CHECK + 索引) → codegen 刷新

Phase 2: 后端（串行，依赖 Phase 1）
  Task 3 (C-1 jOOQ) → Task 4 (C-2~C-9) → Task 5 (Major) → Task 6 (Minor)
  → Task 7 (oplog 重命名)  ← 必须在 Task 5-6 之后（都改 oplog 模块文件）

Phase 3: 前端（可与 Phase 2 并行，目录隔离）
  Task 8 (C-5) → Task 9 (C-6) → Task 10 (C-7) → Task 11 (Major) → Task 12 (Minor)

Phase 4: 文档
  Task 13 ← 等 Phase 2 + 3 全部完成
```

**推荐分两个并行 session**：
- Session A（server/）：Task 1 → 2 → 3 → 4 → 5 → 6 → 7
- Session B（client/）：Task 8 → 9 → 10 → 11 → 12
- 最后 Task 13 汇总
