# Meta-Build 前端设计

> **前端设计的唯一入口**。CLAUDE.md 只索引本文件；本文件再二级分发到 11 个子文档。
>
> 任何前端设计的细节调整都先改子文件，反向索引在本文件吸收变化，CLAUDE.md 保持零感知。

---

## 一句话定位

meta-build 前端 = **给 AI 执行的不可动摇的契约 + 千人千面的定制能力**。架构边界、层级隔离、主题一致性、千人千面保护由 **pnpm workspace + dependency-cruiser + TypeScript strict + Biome + stylelint + 主题/i18n 完整性脚本** 多层守护，让 AI 越界即编译失败或校验失败。

底座（L1-L4）和业务代码（L5）物理隔离——使用者 fork 后可以改一切，但工具会拦截破坏千人千面承诺的改动（硬编码颜色、反向 import、动态拼接 class 等）。通过 **纯 CSS Variables** 承载主题、**5 层 pnpm workspace** 隔离第三方 UI/基础设施库、**双树权限架构**（路由树 + 菜单树）解耦代码结构和菜单组织。

---

## 子文档导航

| 文件 | 关注点 | 何时读 |
|------|-------|-------|
| [01-layer-structure.md](./01-layer-structure.md) | 5 层 package 结构 + 依赖方向 + 脚手架定位 + 每层白名单 | **从这里开始** / 加新 package / 调依赖方向 |
| [02-ui-tokens-theme.md](./02-ui-tokens-theme.md) | L1 CSS Variables + Style Registry + ColorMode + Customizer CSS 维度 + 完整性校验脚本 | 改主题 / 加新风格 / 调整语义 token |
| [03-ui-primitives.md](./03-ui-primitives.md) | L2 42 原子组件 + Radix 隔离哲学 + Storybook 规范 | 改原子组件 / 加新 variant |
| [04-ui-patterns.md](./04-ui-patterns.md) | L3 8 业务组件 API + TanStack Table/RHF 隔离 | 改业务组件 / 加新复合组件 |
| [05-app-shell.md](./05-app-shell.md) | L4 Layout Resolver + Preset Registry + Provider + 认证门面 + 完整 i18n 工程 | 改布局 / 改 i18n / 改全局 UI |
| [06-routing-and-data.md](./06-routing-and-data.md) | TanStack Router 文件路由 + TanStack Query + 路由守卫 | 加新路由 / 调数据加载 |
| [07-menu-permission.md](./07-menu-permission.md) | **双树权限架构**（路由树 + 菜单树） | **改权限 / 改菜单运维 UI** |
| [08-contract-client.md](./08-contract-client.md) | @mb/api-sdk 消费 + 契约驱动链路 + 请求拦截器 | 调 API / 调错误处理 |
| [09-customization-workflow.md](./09-customization-workflow.md) | 脚手架 5 条定制路径 + 千人千面保护 | 使用者首次上手 / AI 辅助定制 |
| [10-quality-gates.md](./10-quality-gates.md) | 13 条前端硬约束 + 2 条推荐 + 完整工具链 + 触发时机 | 加新约束 / 调 CI |
| [11-antipatterns.md](./11-antipatterns.md) | 前端反面教材 + 元教训 | Review 代码时 / 判断 AI 是否"发挥过度" |
| [appendix.md](./appendix.md) | 术语表 + 依赖图 + 缩写词 + 前后端交叉引用 | 查术语 |

---

## 5 项前端核心决策回顾

本章节只列决策结论，决策背景与权衡见规划文档和 brainstorming 对话记录。

| # | 决策 | 结论 |
|---|------|------|
| 1 | 分层 | **5 层 pnpm workspace**：`@mb/ui-tokens` → `@mb/ui-primitives` → `@mb/ui-patterns` → `@mb/app-shell` → `apps/web-admin`。物理隔离每层的第三方依赖 |
| 2 | 主题工程模型 | **纯 CSS Variables Only + Style/Mode 正交维度**。CSS 文件本身是源数据，扁平命名（`--color-primary` 不用嵌套），Style / ColorMode / Customizer CSS 维度分离，无 TS→CSS 编译步骤 |
| 3 | 脚手架 vs 框架 | **纯脚手架模式**。git 模板仓库；L1-L5 全部源码都是使用者资产；使用者 fork 后默认不升级；不做 CLI、不发布 npm |
| 4 | 契约密度 | **务实方案**：依赖方向 + TS strict + Biome + stylelint + dependency-cruiser + 主题/i18n 校验脚本；全部现成工具（~180 行自写配置） |
| 5 | 权限/菜单架构 | **双树设计**：路由树（代码扫描产物，只读）+ 菜单树（运维自由组织，引用路由树）。架构层面解耦代码结构和菜单呈现 |

---

## 文档边界

| 其他文档 | 关系 |
|---------|-----|
| [docs/specs/backend/](../backend/README.md) | 通过契约驱动（`@mb/api-sdk`）与本文档解耦，互不依赖 |
| [CLAUDE.md](../../../CLAUDE.md) | 索引式结构，只引用本文件的反向索引段 |
| [docs/adr/](../../adr/) | 双树架构等关键决策的 ADR 待 spec 定稿后补写 |
| [meta-build规划_v1_最终对齐.md](../../../meta-build规划_v1_最终对齐.md) | ground truth 基线，本文档是它的"前端实施展开版" |

---

## 5 层 package 全景

```
client/
├── packages/
│   ├── ui-tokens/          # L1 设计令牌 + Style Registry（纯 CSS Variables）
│   ├── ui-primitives/      # L2 42 原子组件（隔离 Radix/shadcn）
│   ├── ui-patterns/        # L3 8 业务组件（隔离 TanStack Table/RHF）
│   ├── app-shell/          # L4 布局 + Provider + 认证门面 + i18n 机制
│   └── api-sdk/            # 契约客户端 package（手写层入 git，generated/ 不入 git，orval 产物）
├── apps/
│   └── web-admin/          # L5 业务代码（features + routes）
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── biome.json
```

**依赖方向（严格单向，不可反转）**：

```
@mb/ui-tokens → @mb/ui-primitives → @mb/ui-patterns → @mb/app-shell → apps/web-admin
                                                                           ↓
                                                                    @mb/api-sdk
```

详细规则 / 每层白名单 / 脚手架定位见 [01-layer-structure.md](./01-layer-structure.md)。

---

## 阅读路径（按角色）

| 我是谁，要做什么 | 建议章节顺序 |
|---|---|
| **AI，要改主题** | README → [02-ui-tokens-theme.md](./02-ui-tokens-theme.md) → [10-quality-gates.md §4.9](./10-quality-gates.md) 主题完整性脚本 |
| **AI，要加新业务模块** | README → [06-routing-and-data.md](./06-routing-and-data.md) → [07-menu-permission.md](./07-menu-permission.md) → [08-contract-client.md](./08-contract-client.md) |
| **AI，要加新原子组件** | README → [03-ui-primitives.md](./03-ui-primitives.md) → [02-ui-tokens-theme.md](./02-ui-tokens-theme.md) |
| **AI，要加新业务组件** | README → [04-ui-patterns.md](./04-ui-patterns.md) → [03-ui-primitives.md](./03-ui-primitives.md) |
| **AI，要改壳/布局** | README → [05-app-shell.md](./05-app-shell.md) → [07-menu-permission.md](./07-menu-permission.md) |
| **M1 脚手架实施者** | README → [01-layer-structure.md](./01-layer-structure.md) → [10-quality-gates.md §6.1](./10-quality-gates.md) M1 阶段启用对照 |
| **M2 L1+Theme 实施者** | README → [02-ui-tokens-theme.md](./02-ui-tokens-theme.md) → [03-ui-primitives.md](./03-ui-primitives.md) → [10-quality-gates.md §6.2](./10-quality-gates.md) |
| **M3 L2+L3+L4 实施者** | README → [03-ui-primitives.md](./03-ui-primitives.md) → [04-ui-patterns.md](./04-ui-patterns.md) → [05-app-shell.md](./05-app-shell.md) → [06-routing-and-data.md](./06-routing-and-data.md) → [07-menu-permission.md](./07-menu-permission.md) |
| **使用者首次上手（定制）** | README → [09-customization-workflow.md](./09-customization-workflow.md) → [02-ui-tokens-theme.md](./02-ui-tokens-theme.md) |
| **Review 代码 / 避坑** | [11-antipatterns.md](./11-antipatterns.md) → [10-quality-gates.md](./10-quality-gates.md) |

---

## 前端硬约束反向索引

> **CLAUDE.md 只引用本节**。前端所有 MUST NOT / MUST 的具体规则、防御机制、子文档位置都在这里集中维护。
> 拆分后子文件结构变化时，**只改本节**，CLAUDE.md 零感知。

### MUST NOT 速查（6 条硬约束 + 2 条推荐）

| # | 禁止 | 防御机制 | 详见 |
|---|------|---------|------|
| 1 | ~~硬约束~~ **推荐**：硬编码颜色 / 圆角 / 间距（`bg-[#ff0000]` / `bg-red-500` / `rounded-[4px]` / `style={{color:'#fff'}}`） | Biome + stylelint | [10-quality-gates.md §2.1](./10-quality-gates.md) |
| 2 | 反向 import（低层不能依赖高层；允许单向跨级） | dependency-cruiser + pnpm workspace | [10-quality-gates.md §2.2](./10-quality-gates.md) + [01-layer-structure.md §4](./01-layer-structure.md) |
| 3 | L2-L5 import 白名单外的包（每层独立 allow-list） | dependency-cruiser + `no-restricted-imports` | [10-quality-gates.md §2.3](./10-quality-gates.md) + [01-layer-structure.md §4.3](./01-layer-structure.md) |
| 4 | `apps/web-admin/src/features/**` 直接 import `@mb/api-sdk/auth/*` 的状态管理接口（`routes/auth/**` 豁免） | dependency-cruiser 子路径规则 | [10-quality-gates.md §2.4](./10-quality-gates.md) + [08-contract-client.md §6](./08-contract-client.md) |
| 5 | 非 `routes/**/*.tsx` 的位置声明路由 | TanStack Router 约定 + Vite 插件 | [10-quality-gates.md §2.5](./10-quality-gates.md) + [06-routing-and-data.md §2](./06-routing-and-data.md) |
| 6 | L1 `@mb/ui-tokens` 依赖任何 `@mb/*` package | dependency-cruiser | [10-quality-gates.md §2.6](./10-quality-gates.md) + [01-layer-structure.md §4](./01-layer-structure.md) |
| 7 | 主题 CSS 使用非扁平命名（嵌套 / 点分段命名禁用） | 主题完整性脚本 | [10-quality-gates.md §2.7](./10-quality-gates.md) + [02-ui-tokens-theme.md §4](./02-ui-tokens-theme.md) |
| 8 | ~~硬约束~~ **推荐**：动态拼接 Tailwind class name（``bg-${x}-500`` 生产构建样式丢失） | Biome 正则规则 | [10-quality-gates.md §2.8](./10-quality-gates.md) + [11-antipatterns.md §5](./11-antipatterns.md) |

### MUST 速查（7 条）

| # | 必须 | 详见 |
|---|------|------|
| 1 | L2 / L3 组件必须有 Storybook 故事（每个 variant 一个；M2 必做） | [10-quality-gates.md §3.1](./10-quality-gates.md) + [03-ui-primitives.md §5](./03-ui-primitives.md) |
| 2 | 所有主题必须定义全部 54 个语义 token（主题完整性脚本校验） | [10-quality-gates.md §3.2](./10-quality-gates.md) + [02-ui-tokens-theme.md §8](./02-ui-tokens-theme.md) |
| 3 | L5 路由必须声明权限（`requireAuth({ permission: 'xxx.yyy' })` 或 `@PermitAll`） | [10-quality-gates.md §3.3](./10-quality-gates.md) + [06-routing-and-data.md §3](./06-routing-and-data.md) |
| 4 | L5 业务代码必须通过 `@mb/api-sdk` 调后端（禁止手写 fetch / axios） | [10-quality-gates.md §3.4](./10-quality-gates.md) + [08-contract-client.md §3](./08-contract-client.md) |
| 5 | L2-L5 组件样式必须通过 Tailwind 语义 class 消费主题 | [10-quality-gates.md §3.5](./10-quality-gates.md) + [03-ui-primitives.md §4.4](./03-ui-primitives.md) |
| 6 | 代码静态文案走 i18n，**数据库存储的文案永不走 i18n** | [10-quality-gates.md §3.6](./10-quality-gates.md) + [05-app-shell.md §7](./05-app-shell.md) |
| 7 | 所有 `import.meta.env.*` 引用的变量必须在 `.env.example` 声明 | [10-quality-gates.md §3.7](./10-quality-gates.md) + [10-quality-gates.md §4.11](./10-quality-gates.md) 脚本实现 |

---

## ADR 索引

| ADR | 主题 | 状态 |
|-----|------|------|
| [0016](../../adr/0016-前端主题系统从theme切换到style加color-mode与customizer.md) | 前端主题系统从 Theme 切换到 Style + ColorMode + Customizer | 已采纳 |
| [0017](../../adr/0017-app-shell从固定布局切换到layout-resolver加preset-registry.md) | App Shell 从固定布局切换到 Layout Resolver + Preset Registry | 已采纳 |
| [0018](../../adr/0018-废弃compact主题改为style加customizer维度组合.md) | 废弃 Compact 主题，改为 Style + Customizer 维度组合 | 已采纳 |

后端 ADR 见 [docs/adr/](../../adr/)（目前 0001-0012 全部为后端决策）。

---

## 维护约定（防 drift 铁律）

| 场景 | 正确做法 |
|------|---------|
| 改前端架构 | 先改对应子文件 → 必要时回写本 README 反向索引 → 写新 ADR（如果是决策翻转） |
| 翻转既有决策 | 写新 ADR，**不改规划文档原文**，后续以新 ADR 为准 |
| 加新硬约束 | 在子文件加章节 + 防御工具配置 → 在本 README 反向索引补一行（这是 CLAUDE.md 唯一感知点） |
| 新拆 / 合并子文件 | 改本 README 导航 + 反向索引锚点；**不改 CLAUDE.md** |
| 发现 drift | 立即修正，不允许"等下次一起改"——nxboot 反面教材 |
| 完成 milestone | 子文件回补 `[M2 时补]` / `[M3 时补]` 占位 |
| 验证文档完整性 | 跑 `./scripts/verify-frontend-docs.sh`（检查文件存在 + 格式合规 + 关键词 + drift 扫描 + 行数平衡）|

---

## 写法约定（本目录所有子文件遵守）

1. 每个子文件顶部有 **`> 关注点：...`** 引言块，一句话说清本文件的边界
2. 章节按 **数字编号**（`## 1. / ### 1.1`）
3. 每章 / 每小节有 **milestone 标签** `[M1]` / `[M2]` / `[M3]` / `[M1+M2]`
4. **决策结论在前**，权衡和原理在后
5. **大量使用表格**：决策对比、白名单依赖、硬约束速查、角色阅读路径
6. **代码骨架用完整可编译代码**（含 import + export + 类型定义），不是伪代码
7. **关键章节末尾有 `<!-- verify: <command> -->`**（前端用 `pnpm` / `vite` / `tsc` / `pnpm -F` 等命令）
8. **不引用未实现的组件**——每个被引用的 hook / 类型 / 文件必须有真实路径
9. 标题纯中文 + 数字编号，**避免冒号 / 斜杠 / 括号**（影响 markdown anchor）
10. 每个子文件**末尾**有 `[← 返回 README](./README.md)`
11. **文档与代码同步演进**：每完成一个模块就回补对应章节（避免 nxboot 式 drift）
12. **严格对齐 brainstorming 决策**，不要发挥——如果有疑问，对话即权威，不要自行扩展

---

## 状态

- **2026-04-11 定稿**：M0 前端 spec 全部落盘（README + 11 子文件 + appendix，共 13 个 .md 文件，约 11800 行）
- **本次写作来源**：2026-04-11 brainstorming 会话（17 项决策 + 13 条前端硬约束 + 2 条推荐 + 双树权限架构 + i18n 8 子决策）
- **M4.2 对齐**：后端已去除全表通用软删除位；前端路由树的代码侧 fallback 字段统一使用 `is_stale` 语义，明确区分"代码侧已不再出现"和运维删除两个概念（2026-04-11 drift 清理完成）
- **验证脚本**：`./scripts/verify-frontend-docs.sh`（137 / 0 全绿）
- **下一步**：洋哥 review → 可选写双树架构 ADR → 进入 M1 脚手架实施计划
