---
name: Mixed commit 必须精细回退，禁用 git revert 一刀切
description: 含"部分要保留、部分要撤"的 commit（mixed commit），禁用 git revert；手动 git show + 精准剥离 + grep 扫残留
type: pitfall
scope: 流程 / Git
triggers:
  - 撤销一个 commit 的部分改动
  - ADR 撤销后回滚代码
  - 合并的 commit（一次 commit 包含多个独立主题）需要剥离
---

# Mixed commit 必须精细回退

## 规则

1. 一个 commit 包含多个独立主题（例如 `feat(notification): 超时 + 日志表 + token 缓存 + 共享 RestTemplate + 条件化` 这种一口气 5 件事），并且你只想撤其中**部分**主题 → **禁用 `git revert`**
2. 正确做法：
   - `git show <commit> -- <file>` 看这个文件在该 commit 的 diff
   - 手动 `Edit` 文件回退"要撤"的部分，**保留"要留"的部分**
   - 对涉及的每个文件重复
3. 回退后**强制**扫描残留：
   ```bash
   grep -rn "<被撤销的类名/方法名>" server/ docs/  # 期望只在 ADR / 文档里出现
   grep -rn "<被删除的配置 key>" server/             # 期望 0 结果
   ```
4. 残留扫描结果必须 0 或"只在 ADR/历史文档里"；否则继续剥离

## Why

**2026-04-18 meta-0023 会话撤销 ADR-0021/0022 相关 commit**：

- `fdc91251 feat(iam): 权限码 Redis 缓存 + PermissionWriteFacade 事件驱动失效`
  → 整个 commit 撤（纯单主题，`git revert` 本来可以）
- `88081d75 feat(notification): 渠道独立超时 + 投递日志表 + 微信 token 缓存 + 共享 RestTemplate + AutoConfig 条件化`
  → **Mixed commit，含 5 个独立主题**，只撤"渠道独立超时"一个，保留其他 4 个
- `13bcc06b test(arch): 补 ArchUnit 三条规则（RestTemplate / @Scheduled / PermissionFacade）`
  → **Mixed**，撤 PermissionFacade 规则，保留其他 2 条

如果当时对 `88081d75` 无脑 `git revert 88081d75`，会一起抹掉：
- `WeChatAccessTokenCache`（Caffeine 缓存，有真实价值的优化）
- `RestTemplate` 共享 Bean 注入（配合 `HttpClientRule.NO_DIRECT_REST_TEMPLATE_CONSTRUCTION`，缺一个另一个 ArchUnit 规则会失效）
- `DeliveryLog` 表 + Repository + Service（未来 Outbox 演进基础）
- `@ConditionalOnProperty` 条件化

这些被无辜抹掉后再一个个手动加回，代价远大于"一开始就精细剥离"。

## How to apply

### 判断是不是 mixed commit

看 commit message。如果标题是"A + B + C"、"批量 XXX"、"N 项合一"，几乎肯定是 mixed。
看 commit message 正文的 bullet 列表长度。> 3 个 bullet 基本是 mixed。
看 `git show <sha> --stat`。跨多个模块 / 多种 scope（如同时改 api + domain + infra）常是 mixed。

### 剥离流程

1. **列清单**：
   ```markdown
   ## Commit <sha> 剥离清单
   要撤：A, C
   要留：B, D, E
   ```

2. **逐文件 diff + 决定**：
   ```bash
   git show <sha> --stat                    # 列所有改动文件
   git show <sha> -- <file>                  # 单文件 diff
   ```
   对每个文件判断：这个文件的改动属于 A/C（撤）还是 B/D/E（留）？

3. **精细回退**：用 `Edit` / `Write` 工具逐文件回退"撤"部分。**不要用 `git checkout <sha>^ -- <file>`**，因为可能把文件里"留"的部分也一起还原走。

4. **编译 + 扫残留**：
   ```bash
   ./mvnw -pl <module> -am compile
   grep -rn "<要撤的主要符号>" server/
   ```

5. **Commit message 明确标注"部分回退"**：
   ```
   revert(xxx): 撤销 <主题 A>（部分回退 <sha>，见 ADR-XXX）
   
   <sha> 原 commit 含 A/B/C/D/E 五主题，本次只回退 A。
   保留：B / C / D / E（各自理由 ...）
   ```

### 残留扫描的检查项

对每个撤的符号扫四个地方：
- `server/` 源码 → 必须 0 结果
- `docs/adr/` → 允许（历史 ADR 文档会引用）
- `docs/rules/` → 允许（rule 文档可能举例）
- `docs/handoff/` → 允许（交接文档可能引用）
- `.github/workflows/` → 必须 0 结果（CI 可能残留旧命令）

### 和 git revert 的区别

| 维度 | `git revert <sha>` | 精细回退 |
|---|---|---|
| 适用 | 单主题 commit | mixed commit |
| 粒度 | 整 commit | 文件级 / 行级 |
| 回退历史 | 生成新 commit 反向 | 手动新 commit |
| 保留能力 | 无（全撤） | 有（可选） |
| 残留风险 | 低（git 自动） | 需手动 grep 验证 |

### 关联规则

- `docs/rules/cross-review-residual-scan.md`（批量替换后必须 grep 扫残留）— 本 rule 的回退场景对应
- `docs/rules/plan-code-snippets-must-verify.md`（AI 跨文件引用必须 grep 验证）— 同属"置信度验证"family
