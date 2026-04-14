# Meta-Build 规则库索引

## Frontmatter 规范

每条规则一个文件，包含以下 frontmatter：

```markdown
---
title: 规则标题
type: pitfall | playbook        # pitfall=踩坑经验（防重犯） playbook=正面经验（可复用的操作模式）
triggers: [关键词1, 关键词2]     # AI 开始任务时扫这些词判断相关性
scope: [后端/前端/全栈/构建/部署/流程]
---
```

**正文格式**：
- `pitfall`：规则 → Why（踩坑事件+日期） → How to apply
- `playbook`：模式 → 适用场景 → 具体步骤 → 效果数据

## 使用流程

- **做事前**：扫下面的 triggers 列，匹配到就读对应规则
- **做事后**：发现新坑或验证了好的操作模式，主动写入并更新本索引
- **写日志时**：项目日志末尾的"规则库复盘"区域是经验采集的结构化触发点（模板见 CLAUDE.md 维护约定），强制回答三个问题：涉及了哪些规则 / 有没有新规则候选 / 有没有规则需要修正

## 生命周期管理

| 操作 | 触发时机 | 做什么 |
|------|---------|--------|
| **归档** | 规则对应的踩坑已被工具化守护（ArchUnit / CI / 编译器） | 移到 `archive/`，本索引标注归档原因 |
| **合并** | 同 scope 细碎规则 ≥3 条且逻辑可合并 | 合并为一条，旧文件删除 |
| **清理** | 每个 milestone 完成时 | review 全部规则的时效性，过时的归档 |

## 升级路径（软规则 → 硬约束）

满足以下**任一**条件时，rule 应升级为 MUST/MUST NOT + 工具守护：

1. 同一条规则被违反 ≥2 次（人会忘，工具不会）
2. 违反后果是编译/运行时错误（能被自动化检测的就不该靠自觉）
3. 规则可以用确定性逻辑表达（能写成 grep / ArchUnit / lint 规则的）

升级后：原 rule 文件移到 `archive/`，标注"已升级为 MUST #XX / ArchUnit 规则 YYY"。

---

## 踩坑经验（pitfall）

### 流程
| 规则 | triggers | 来源 |
|------|----------|------|
| [ADR 必须先于代码/文档变更](adr-before-code.md) | 翻转决策, 新架构概念, 改 specs | 0412 ADR-0009~0012 补写教训 |
| [verify 块纪律](verify-block-discipline.md) | specs, verify, 新增约束 | 0413 verify-docs.sh 覆盖缺口 |
| [交叉审查 + 残留扫描](cross-review-residual-scan.md) | 批量替换, 重命名, 多 agent 并行 | 0411 命名重构 + 0412 并行修改残留 |

### 全栈
| 规则 | triggers | 来源 |
|------|----------|------|
| [前后端联查](frontend-backend-joint-check.md) | API 契约, DTO, 认证, 权限点, 表结构 | 0413 前后端联查 6C+6I+4M |
| [模板错误会被 AI 批量复制](template-propagation-risk.md) | DDL 模板, 代码骨架, 12 步清单, 代码生成 | 0413 DBA 走查发现 5 个 DDL 缺陷 |

### 后端
（M1 编码阶段积累）

### 前端
（M2 编码阶段积累）

### 构建与部署
（M1 CI 搭建后积累）

---

## 正面经验（playbook）

### 流程
| 规则 | triggers | 来源 |
|------|----------|------|
| [多视角审查](multi-perspective-review.md) | review, 审查, 定稿, milestone 交付 | 0412 四维审查 + 0413 七角色走查，含两套验证过的角色清单 |

---

## 已归档（archive/）

（暂无）
