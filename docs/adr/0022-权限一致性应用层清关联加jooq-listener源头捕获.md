# ADR-0022：权限一致性方案——FK RESTRICT + Repository 应用层清关联 + jOOQ listener 源头捕获

- **状态**：已采纳
- **日期**：2026-04-18
- **决策者**：洋哥 + 小灵犀
- **相关文档**：[ADR-0007](0007-继承遗产前先问原生哲学.md)（元方法论）、ADR-0008（一致性 > 局部优化）、[ADR-0021](0021-虚拟线程加java25加通知分发取消同步聚合.md)（同日决策）
- **类型**：架构翻转（推翻 commit `fdc91251` 的 PermissionWriteFacade + ArchUnit 方案）

---

## 背景

### 触发事件：代码审查发现 PermissionService 无缓存

2026-04-18 多角色代码审查，性能审查员指出：`PermissionService.findPermissionCodesByUserId()` 是 `@RequirePermission` 鉴权切面高频调用的方法，每次查 DB（关联 `user_role + role_menu + menu` 三表 JOIN）——典型"高频读、低频写"场景没缓存。

洋哥选择**方案 B**（事件驱动失效 + Redis 24h 兜底 TTL），理由："纯 TTL 会造成数据不一致，完全不可以"。

### 上一轮错解：Facade 门面 + ArchUnit 方法名白名单

commit `fdc91251` 的实现思路：
- `PermissionCache`：Redis 缓存（key `mb:iam:perm:{userId}`，TTL 24h）
- `PermissionWriteFacade`：所有改权限/角色/用户角色的写操作必须经过它
- `PermissionChangedEvent` + `@Async Listener`：afterCommit 发事件，listener DEL Redis key
- **ArchUnit `PermissionWriteRule`**：枚举 8 个 Repository 方法（`RoleRepository.deleteUserRolesByUserId` 等），禁止在 Facade 之外调用——作为"兜底守护"

### 洋哥的第一次质疑

2026-04-18 夜，架构审查员指出 `UserService.deleteUser` / `MenuService.deleteMenu` **绕过 Facade**——直接调 `userRepository.deleteById` / `menuRepository.deleteById`，不清 `user_role` / `role_menu`、不发 `PermissionChangedEvent`。

小灵犀给的方案：
- **方案 A**：把 `deleteUser` / `deleteMenu` 迁入 Facade
- **方案 B**：Facade 加钩子 `beforeUserDeleted / beforeMenuDeleted`
- ArchUnit 规则从"方法名白名单"升级到"表级拦截"或保持方法名白名单并补全

洋哥直接拒绝：

> "我觉得这些方案都不行。为什么 UserService.deleteUser 和 MenuService.deleteMenu 会出现 ArchUnit 方法白名单保护的问题呢？
>
> 回归第一性原理，你不光要考虑当前这种情况是否有利于我们处理权限，你还要反思：
> 1. 当前这种情况本身实现得合不合理
> 2. ArchUnit 的规则过滤得合不合理"

### 第一性原理反思

#### 反思 1：`UserService.deleteUser` 当前实现合理吗？

**合理**。它调 `userRepository.deleteById` 就对了——这是它唯一的职责。

"删 user 应该同时清 user_role"这件事**不应该**是 `UserService` 的职责——它是**数据完整性约束**，应当由数据库保证（FK ON DELETE CASCADE）。让业务代码去记得删关联表 = 把 RDBMS 的本职工作外包给 Java。

`MenuService.deleteMenu` 同理。

#### 反思 2：`PermissionWriteRule` 设计合理吗？

**不合理**。这条规则用"谁能写权限表"作为守卫维度，和真正要防的事情（缓存一致性）**不等价**：

| 变更路径 | 规则能挡住吗？ |
|---|---|
| Java 代码直接写表 | ✅ 能挡 |
| FK cascade 级联删除 | ❌ 挡不住（DB 内部变更，Java 代码看不到） |
| Flyway migration 手工 SQL | ❌ 挡不住 |
| 运维紧急 `psql` 操作 | ❌ 挡不住 |
| Facade 实现里忘发事件 | ❌ 挡不住（不是"谁改"的问题） |

规则只能防**最粗心的一种**失效路径——却给了"已经上锁"的虚假安全感。这正是 CLAUDE.md "反面教材第 2 条" opt-in 安全模式的再次复现。

#### 根本问题

**把"业务动作封装"和"缓存一致性"两件事塞进同一个 Facade**：
- 业务动作封装（`assignRolesToUser` 多步编排）→ Facade 合理
- 缓存一致性（DB 变了，缓存跟着变）→ **应该从变更源头捕获，不是从调用源头**

"源头"在哪？**SQL 层**。不管谁发出 SQL（业务代码、FK cascade、手工脚本），只要到达数据库，jOOQ listener 都能看到。

---

## 第二次洞察：DB cascade 违反"业务逻辑必须在应用层"

调研后发现 FK cascade 有一个致命问题：**jOOQ ExecuteListener 无法捕获 DB 内部的 cascade 删除**。

- 应用发 `DELETE FROM mb_iam_user WHERE id = 1`
- jOOQ listener 看到的就是这一条 DELETE user
- DB 内部触发的 `DELETE FROM mb_iam_user_role WHERE user_id = 1` 是引擎内部行为，应用不可见

这迫使设计两选一：

- **保留 cascade**：接受"删 user/menu/role 路径需要业务层主动发事件"——回到 opt-in
- **禁 cascade**：FK 改 RESTRICT，Repository 内部显式先清关联再删主记录——所有 SQL 都走 jOOQ，listener 100% 覆盖

### 洋哥点出的元原则

> "我觉得可以啊。其实之前把这种级联的更新删除做在数据库层面，是我的一个决策失误。
>
> 确实，我们应该把所有的逻辑都放在应用层做，只要是和某一个业务相关的，都应该放在业务层做。**即便业务层实现起来比较复杂，即便需要维护一致性，也都要放在应用层做。否则的话，根本不知道底层发生了什么，后来的维护者也不知道前因后果。**"

这条元原则已固化为 meta-build 协作 feedback memory（`feedback_business_logic_in_application_layer.md`）：
> **业务逻辑必须在应用层做。即便实现复杂、需要自行维护一致性，也不要把业务语义下沉到 DB 层（FK cascade、trigger、stored procedure）。FK 保留用于引用完整性检查（RESTRICT），不是自动级联业务操作。**

---

## 第三次洞察：PostgreSQL FK RESTRICT 的锁机制已解决并发一致性

架构审查员曾担心 `deleteRole` 与 `assignRolesToUser` 并发时的一致性窗口：
- A 事务 `deleteRole(R)`：查受影响用户 `{u1, u2}` → 删 user_role → 删 role → 发事件 `{u1, u2}`
- B 事务并发 `assignRolesToUser(u3, [R])`：插入 `user_role(u3, R)` → 提交
- 如果 B 在 A 查询之后提交，A 的事件漏了 u3 → u3 缓存残留旧权限

看似真问题。但第一性原理推演后发现**在 PostgreSQL + RESTRICT FK 下不成立**：

### PostgreSQL FK 的锁机制

FK 约束实现底层用 `FOR KEY SHARE` lock（[PostgreSQL 文档](https://www.postgresql.org/docs/current/explicit-locking.html)）：

- 子表 INSERT/UPDATE 引用父表行时，对父表该行加 `KEY SHARE` lock
- 父表 DELETE/UPDATE KEY 时，需要 `KEY EXCLUSIVE` lock
- **两者互斥**

### 真实时序

```
事务 A                        事务 B
───────                      ───────
BEGIN                         BEGIN
DELETE user_role              
  WHERE role_id=R             
(删了 {u1,u2})                
                              INSERT user_role(u3, R)
                              ↓ 隐式对 role[R] 加 KEY SHARE LOCK
                              成功（未提交）
DELETE role WHERE id=R
↓ 要 KEY EXCLUSIVE LOCK
↓ 被 B 的 KEY SHARE LOCK 阻塞
↓ 等 B
                              COMMIT
↓ B 已释放锁，A 继续
↓ 检查 RESTRICT → user_role 
   还有 (u3,R) → 拒绝
FK CONSTRAINT VIOLATION
ROLLBACK
```

**A 整个事务回滚**——u1 u2 的删除也回滚。最终状态：
- role=R 仍存在
- u1 u2 u3 都正确持有 R
- A afterCommit 不触发（事务回滚了），不发任何事件
- B afterCommit 触发，listener 发 `PermissionChangedEvent({u3})`
- u3 缓存被清，下次查到正确权限

**全局一致，并发漏集问题不存在**。

反方向（A 先提交）：B 的 INSERT 触发 FK 检查发现 role=R 不存在 → INSERT 失败（assignRolesToUser 报错"角色不存在"）。也是正确语义。

### 意外收获

原本担心的并发一致性问题，**被 FK RESTRICT + 应用层清关联 + jOOQ listener 三者叠加自动解决**，无需任何应用层加锁。

---

## 决策

### 决策 1：FK 从 CASCADE 改 RESTRICT

新 migration `V20260619_00X__iam_fk_cascade_to_restrict.sql`（具体序号实施时定）：

```sql
-- user_role FK
ALTER TABLE mb_iam_user_role DROP CONSTRAINT fk_iam_user_role_user;
ALTER TABLE mb_iam_user_role 
    ADD CONSTRAINT fk_iam_user_role_user 
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id) 
    ON DELETE RESTRICT;

ALTER TABLE mb_iam_user_role DROP CONSTRAINT fk_iam_user_role_role;
ALTER TABLE mb_iam_user_role 
    ADD CONSTRAINT fk_iam_user_role_role 
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id) 
    ON DELETE RESTRICT;

-- role_menu FK
ALTER TABLE mb_iam_role_menu DROP CONSTRAINT fk_iam_role_menu_role;
ALTER TABLE mb_iam_role_menu 
    ADD CONSTRAINT fk_iam_role_menu_role 
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id) 
    ON DELETE RESTRICT;

ALTER TABLE mb_iam_role_menu DROP CONSTRAINT fk_iam_role_menu_menu;
ALTER TABLE mb_iam_role_menu 
    ADD CONSTRAINT fk_iam_role_menu_menu 
    FOREIGN KEY (menu_id) REFERENCES mb_iam_menu(id) 
    ON DELETE RESTRICT;
```

### 决策 2：Repository 内部封装"实体完整删除"

```java
// UserRepository.deleteById（伪代码）
@Transactional
public void deleteById(Long userId) {
    // 1. 先清关联表（走 jOOQ → listener 捕获 → 自动发事件）
    dsl.deleteFrom(MB_IAM_USER_ROLE)
       .where(MB_IAM_USER_ROLE.USER_ID.eq(userId))
       .execute();
    // 2. 再删主记录
    dsl.deleteFrom(MB_IAM_USER)
       .where(MB_IAM_USER.ID.eq(userId))
       .execute();
}

// MenuRepository.deleteById：先清 role_menu WHERE menu_id=? 再删 menu
// RoleRepository.deleteById：先清 user_role WHERE role_id=? + role_menu WHERE role_id=? 再删 role
```

Repository 的职责扩展为"**实体生命周期管理**"（DDD 仓储模式的正确用法）——调用方（Service）无需知道权限语义。

### 决策 3：新增 `PermissionChangeExecuteListener`（jOOQ 层）

路径：`mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/permission/PermissionChangeExecuteListener.java`

职责：
- 监听对 `mb_iam_user_role` / `mb_iam_role_menu` 的 INSERT / UPDATE / DELETE
- 在 `executeStart` / `executeEnd` 提取受影响 userIds：
  - `INSERT user_role(user_id, role_id)` → userIds = {user_id from SQL bind}
  - `DELETE user_role WHERE user_id = ?` → userIds = {user_id from SQL bind}
  - `DELETE user_role WHERE role_id = ?` → 执行前先查 `SELECT user_id WHERE role_id = ?`
  - `DELETE role_menu WHERE role_id = ?` → 查 `SELECT DISTINCT ur.user_id FROM user_role ur WHERE ur.role_id = ?`
  - `DELETE role_menu WHERE menu_id = ?` → 查"所有持有该菜单所在角色的用户"
- 在事务 `afterCommit` 发 `PermissionChangedEvent(userIds)`
- 监听器 `@Async` 消费事件 → DEL Redis key

参考：`DataScopeExecuteListener`（已有同模式的 listener，同样基于 SQL 层捕获）

### 决策 4：删除 PermissionWriteFacade 和 PermissionWriteRule

| 被删除的组件 | 原职责 | 新归属 |
|---|---|---|
| `PermissionWriteFacade` | 收口所有权限写路径 | 职责拆解：业务动作封装 → 各 Service 自己负责；缓存失效 → jOOQ listener |
| `PermissionWriteRule` (ArchUnit) | 守护 Facade 收口 | 不需要（listener 源头捕获天然覆盖） |
| `RoleService.deleteRole` → Facade 的调用链 | 用 Facade 做级联清理 | 改为直接调 `RoleRepository.deleteById`（Repository 内部已封装清关联） |
| `MenuService.assignMenusToRole` → Facade | 用 Facade 做权限关联 | 改为直接用 jOOQ 写 `role_menu`（listener 自动发事件） |

### 砍掉的概念

与 commit `fdc91251` 对比，**全部砍掉**：

- ❌ `PermissionWriteFacade` 类
- ❌ `PermissionWriteRule` ArchUnit 规则 + 对应 `@Test` 方法
- ❌ `MB_IAM_USER_ROLE` / `MB_IAM_ROLE_MENU` 的 `ON DELETE CASCADE`
- ❌ Facade 内的 `TransactionSynchronizationManager.registerSynchronization` 事件发送
- ❌ Facade 内"当无事务时直接 publish"的 else 分支（坏味道）
- ❌ Service 层调 Facade 的间接链路

### 保留的概念

- ✅ `PermissionCache`（Redis 缓存本身不变）
- ✅ `PermissionChangedEvent` record
- ✅ `PermissionChangedEventListener` @Async DEL Redis
- ✅ `PermissionService` 的缓存读路径

---

## 前置条件（明确列出依赖链）

本方案的正确性**依赖以下组合**，任一条件变化需重新评估：

### 1. 数据库：PostgreSQL

依赖 PostgreSQL 的 `FOR KEY SHARE` lock 机制把 FK 并发序列化。

**若切换到 MySQL/其他 DB**：需重新验证 FK RESTRICT 在该 DB 下的并发行为。MySQL InnoDB 的 FK 锁行为类似但细节不同（比如 `LOCK IN SHARE MODE` 的粒度），需要单独验证。

### 2. FK 约束类型：RESTRICT（不是 CASCADE）

若未来因性能原因改回 CASCADE，则：
- DB 内部 cascade 绕过 jOOQ listener
- 需要重新设计缓存失效机制（比如应用层主动先查受影响用户再删）

### 3. 事务边界：同一事务内

`UserRepository.deleteById` 的"先清关联、再删主记录"必须在同一事务（Spring `@Transactional`）。若拆事务，中间窗口可能发生：
- T1 清关联 commit
- 并发事务插入新关联
- T2 删主记录 → FK RESTRICT 拒绝 → T2 失败但 T1 已提交 → 数据不一致

**保护**：Spring `@Transactional` 默认 REQUIRED 传播，由 Service 层的事务边界保证；Repository 方法若单独被调用也要加 `@Transactional`。

### 4. 写路径：所有权限表写入必须走 jOOQ

若有代码通过 `JdbcTemplate` 或手写 SQL 绕过 jOOQ 写权限表，listener 看不到，缓存会失效。

**保护**：ArchUnit 已有规则 `JdbcIsolationRule.NO_JDBC_TEMPLATE_IN_BUSINESS` 禁止业务层用 JdbcTemplate；jOOQ 是唯一写路径。

### 5. 运维场景

手工 `psql` / Flyway migration 修改权限表时，**listener 不会触发**。这是接受的限制——这些场景运维应手动 `FLUSHALL` 或应用层重启。

---

## 理由

### 为什么 RESTRICT > CASCADE

- CASCADE 把"清关联"这个业务语义下沉到 DB，应用层看不见（违反"业务逻辑必须在应用层"元原则）
- DB 内部 cascade 绕过 jOOQ listener，缓存失效机制失效
- RESTRICT 是 fail-fast——应用层忘记先清关联就立即报错，问题不会潜伏

### 为什么 jOOQ listener > Facade

- Facade 是 opt-in："谁来调"控制，**漏调就失效**
- Listener 是源头捕获："SQL 发出"控制，**除非不走 jOOQ 否则不会漏**
- Listener 和项目现有的 `DataScopeExecuteListener` 同一套模式，符合 ADR-0007 的"jOOQ 原生哲学"

### 为什么 PostgreSQL FK 锁就够用

- `FOR KEY SHARE` 和 `KEY EXCLUSIVE` 的互斥性把并发 deleteRole + assignRole 自动序列化
- 不需要应用层 `SELECT ... FOR UPDATE`
- 不需要每个写路径主动配合加锁
- 这是"让 DB 做 DB 擅长的事（并发控制）"与"让应用做应用擅长的事（业务语义）"的正确分工

### 为什么 Repository 承担"实体完整删除"

- DDD 仓储模式本职：仓储负责实体的完整生命周期
- Service 不需要知道"删用户会影响权限缓存"这种跨领域知识
- Repository 内部实现细节对调用方透明，未来若优化（比如改批量 SQL）不影响 Service

---

## 影响

### 正面影响

1. **权限缓存一致性 100% 覆盖所有应用层写路径**（无论 Service、Repository、测试代码、脚本）
2. **UserService / MenuService / RoleService 代码回归纯粹**，不需要知道权限语义
3. **ArchUnit 规则少一条**（`PermissionWriteRule` 删除），维护成本下降
4. **并发一致性由 DB 锁保证**，无需应用层加锁
5. **未来新增权限相关表**（如 `role_data_scope_dept`）只需在 listener 白名单加一项，零业务侵入

### 代价

1. **migration 成本**：新 Flyway 文件改 4 个 FK 约束
2. **Repository 改造**：3 个 Repository（User/Menu/Role）的 `deleteById` 内部加清关联逻辑
3. **回退上一轮改动**：删 `PermissionWriteFacade`、删 `PermissionWriteRule`、回退 Service 层的调用改造
4. **listener 实现复杂度**：`DELETE role_menu WHERE menu_id=?` 场景需要跨表查受影响用户（2 次 JOIN）

### 已知限制（本次不处理）

- 未来切换 MySQL 或其他 DB 需重新评估 FK 锁行为
- 手工 `psql` 运维场景 listener 不触发（文档已明示，接受）
- `mb_iam_role_data_scope_dept` 表本次不纳入 listener（与权限码集合无直接关系），未来按需扩展

### 放弃的能力

| 放弃 | 对 meta-build 的影响 |
|------|-------------------|
| FK ON DELETE CASCADE 的"自动清理" | 改由 Repository 内部显式清理，代码多几行但语义清晰 |
| Facade 收口的"同一入口"直觉 | 改由 listener 源头捕获，实际更严格（Facade 挡不住 cascade / 手工 SQL） |
| ArchUnit 方法名白名单的"虚假安全感" | 无损失——这个安全感本来就是虚假的 |

---

## 维护约定

### 关于新权限相关表

未来若加新的"和权限码集合相关"的关联表（比如 `mb_iam_user_data_scope` / `mb_iam_role_permission_override` 等），**必须**：
1. FK 约束用 `ON DELETE RESTRICT`
2. 对应的 Repository 的 `deleteById`（父表）内部先清该关联表
3. 在 `PermissionChangeExecuteListener` 白名单注册新表名

### 关于事件粒度

`PermissionChangedEvent.userIds` 包含变更影响的所有用户 ID。单次 SQL 可能影响多个 userId（例如 `DELETE user_role WHERE role_id=?` 可能影响多个用户）——listener 需要在 SQL 执行前查询出完整 userIds 集合。

### 关于 listener 的性能

在 `DELETE role_menu WHERE menu_id=?` 等场景，listener 需要执行额外 SELECT 查受影响用户。这个成本可接受：
- 权限变更是低频操作（管理员手动触发）
- 多一次 SELECT 相比鉴权缓存命中节省的成本微不足道

如未来出现"超级权限变更"场景（一次影响 10 万用户），再考虑优化（比如用 `SELECT ... FOR UPDATE` 锁定 + 后台 worker 异步计算）。

### 关于切换数据库

项目目前锁定 PostgreSQL 16（CLAUDE.md 已明示）。**切换到其他 RDBMS 需要新 ADR** 重新评估本方案的正确性。

---

## 相关文档

- 翻转的 commit：`fdc91251 feat(iam): 权限码 Redis 缓存 + PermissionWriteFacade 事件驱动失效`
- 配套 ADR：[ADR-0021](0021-虚拟线程加java25加通知分发取消同步聚合.md)（同日决策的另一条架构翻转）
- 元方法论：[ADR-0007](0007-继承遗产前先问原生哲学.md)（jOOQ listener 是 ADR-0007 在权限场景的延伸应用）
- Feedback Memory：`业务逻辑必须在应用层做`（本 ADR 提炼的元原则）
- 现有同模式 listener：`DataScopeExecuteListener`（可作 `PermissionChangeExecuteListener` 实现参考）
- CLAUDE.md：技术栈章节"方案 E 数据权限重构的触发点"脚注（可追加一句"权限缓存一致性延续此思路"）

---

## 致谢

洋哥在本轮讨论中的两次关键追问：

1. **第一问**："为什么 UserService.deleteUser / MenuService.deleteMenu 会出现 ArchUnit 方法白名单保护的问题？是 UserService 的问题还是 ArchUnit 规则的问题？"——戳中"Facade + 白名单"本身是补丁方案。

2. **第二问（在方案刚转向 listener 后）**："是不是可以通过 jOOQ 来解决？你还是要自己去调研一下，然后回归第一性原理重新推导一下。"——逼出"FK cascade 被 listener 看不见"这个致命问题，进而引出"业务逻辑必须在应用层"的元原则。

两次追问把讨论从"Facade 怎么收口"拉到"Facade 该不该存在 / cascade 该不该用"，是本 ADR 诞生的根因。

本 ADR 和 ADR-0007（方案 E 数据权限）、ADR-0008（Flyway 命名）同属"继承惯性 vs 原生哲学"的样本级 ADR——每次都有一个"看似合理的补丁方案"被洋哥的第一性原理追问拆掉。
