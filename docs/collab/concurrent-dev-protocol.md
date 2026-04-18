# 前后端并发开发协作约定

> **适用场景**：meta-build 前后端两个 AI session（Claude Code / Codex）同时推进工作时的协调规则。
>
> **背景**：2026-04-18 前后端同时开 ADR-0021 / ADR-0022 编号撞车，触发本约定制定。

---

## 1. 物理隔离 · Git Worktree

**根目的**：两个 session 的工作区（working tree）不互相看到对方的 dirty state，各自 `git status` 干净，实验和 stash 互不污染。

### 当前安排

| 工作 | 目录 | 分支 |
|---|---|---|
| 后端重构 | `/Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build`（主目录） | `main` |
| 前端 Claude Design 对齐 | `/Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend` | `feat/claude-design-plan-a`（基于 main） |

### 切换规则

- 后端会话：**只在主目录工作**，不进入前端 worktree
- 前端会话：**只在前端 worktree 工作**，不进入主目录（除非需要改本协议 / 共享文件时临时切回）
- 两边都不在同一时间对 `main` 分支做 commit（前端 commit 到 `feat/claude-design-*`，合并时走 rebase/merge 流程）

### 新建 worktree 命令

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
git worktree add ../06-meta-build-frontend -b feat/claude-design-plan-a main
```

完成一个 Plan 后：

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
git fetch origin
git merge --ff-only feat/claude-design-plan-a  # 或者 rebase + merge 走 PR
git push origin main
git worktree remove ../06-meta-build-frontend
```

---

## 2. 共享文件改动约定

以下文件两边都可能改，改动时遵守**段落归属原则** —— 只碰自己领域的段落，不碰对方或共享段。

### 共享文件清单

| 文件 | 前端段落 | 后端段落 | 共享段落（碰前先同步） |
|---|---|---|---|
| `CLAUDE.md` | 前端技术栈 / 前端 MUST / 前端命令 / 前端阅读路径 | 后端技术栈 / 后端 MUST / 后端命令 / 后端阅读路径 | 一句话定位 / 终极目标 / 核心哲学 / 当前阶段表格 / 维护约定 |
| `AGENTS.md` | 同上 | 同上 | 同上 |
| `docs/rules/INDEX.md` | 前端相关 rule 行 | 后端相关 rule 行 | 目录结构 / 命名规范段 |
| `docs/adr/` | 仅新增 `frontend-nnnn-*.md` | 仅新增 `backend-nnnn-*.md` / 现有 `0001-0020-*.md`（后续规整时再拆） | 无 |
| `docs/specs/` | 仅 `docs/specs/frontend/**` | 仅 `docs/specs/backend/**` | 无 |

### 冲突处理

- **段落级冲突**（两边改共享文件的不同段落）：`git merge` 的 3-way 通常能自动解决
- **共享段改动**：改动前先在 git commit message 里登记"TOUCH-SHARED: <段落名>"，另一方发现后短暂暂停对共享段的写
- **共享段撞车**（两边同时改同一段）：以时间先后为序，后改者负责 rebase 并解决冲突

---

## 3. ADR 命名规范

**新 ADR 必须用 scope 前缀** —— `<scope>-<nnnn>-<kebab-title>.md`：

- 前端：`frontend-<nnnn>-xxx.md`
- 后端：`backend-<nnnn>-xxx.md`
- 跨层 / 元方法论：`meta-<nnnn>-xxx.md`

**编号规则**：

- **全局连续递增**（不分前后端各自计数）—— 保证"ADR 编号"是唯一标识
- 开新 ADR 前必须 `ls docs/adr/` 查最大编号 + 1
- 编号连续意味着前后端并发时仍可能撞车 —— 通过"先 ls 再写"的小心和 commit 时发现重复时的让步协商处理

**现有 20 份 ADR**（`0001-*` 到 `0020-*`）不动，后续洋哥抽时间统一规整（迁移到 `backend-/frontend-/meta-` 归属）。

**边界案例**：

- 后端 2026-04-18 已落 `0021-虚拟线程加java25加通知分发取消同步聚合.md` 和 `0022-权限一致性应用层清关联加jooq-listener源头捕获.md`（未加 scope 前缀，属于"规则建立前最后一批"，暂不改）
- 从 `0023` 起所有新 ADR 强制带 scope 前缀
- 若某 ADR 真的跨层（同时影响前后端），用 `meta-` 前缀

详见配套 rule：`docs/rules/adr-numbering-discipline.md`

---

## 4. Session 启动检查清单

两个会话开启时都应做这 3 步：

1. **git 状态**：`git status` + `git log --oneline -5` 看对方最近做了什么
2. **worktree 确认**：`git worktree list` 确认自己在正确目录
3. **共享文件扫描**：`git diff HEAD~5..HEAD CLAUDE.md AGENTS.md` 看对方最近改了什么

---

## 5. 同步机制

- 共享文件任何改动必须 **push 到 origin**，另一方通过 `git pull --ff-only` 获取
- 本协议文档本身也是共享文件，改动时遵守"段落归属"（谁提议改谁负责沟通）
- 有争议 → 升级给人类（洋哥）裁决

---

## 6. 已知 edge case

### A. 前端 worktree 需要修改后端段的共享文件怎么办
临时切回主目录做改动（比如 CLAUDE.md 里"核心哲学"段的跨领域更新），commit 后再切回前端 worktree 继续。

### B. 后端会话 revert 历史 commit 影响了前端依赖的代码
前端 worktree `git fetch` + `git rebase origin/main` 跟上 main 的 revert，检查前端是否有代码依赖那段被 revert 的后端行为。

### C. 前端 worktree 的 branch 合并回 main 时 main 已经 diverge
前端分支 `git rebase main`（或 `git merge main` 进分支）后再合回 main。

---

## 7. 协议升级

本协议是 2026-04-18 的首版，后续如发现新的并发冲突模式，由发现方补充新条款并更新本文档。每次更新在本文档底部记录变更时间和原因。

## 变更记录

- 2026-04-18：首版，前后端 ADR 编号撞车（0021/0022 冲突）触发
