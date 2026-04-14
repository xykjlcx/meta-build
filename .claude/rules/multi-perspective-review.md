---
title: 多视角审查
type: playbook
triggers: [review, 审查, 定稿, specs 完成, 代码实现完成, milestone 交付]
scope: [流程]
---

# 多视角审查

## 模式
大型文档/代码变更完成后，用多个不同视角的 agent 并行审查。单一视角永远有盲区。

## 适用场景
- specs 定稿
- 代码实现完成（milestone 级别）
- 重大架构变更落地后

## 验证过的角色清单

**specs 审查**（0412 后端 specs 定稿，发现 8 Critical）：

| agent | 审查范围 | 切入维度 |
|-------|---------|---------|
| 架构骨架 | 模块分层、依赖方向、包结构 | 设计合理性 |
| 数据+安全 | DDL、认证、权限、数据权限 | 落地可行性 |
| API+配置+可观测 | Controller、application.yml、Actuator | 逻辑一致性 |
| 规则+全局一致性 | MUST/MUST NOT、ArchUnit、交叉引用 | 全局一致性 |

**走查审查**（0413 七角色走查，发现前 4 轮的盲区）：

| 角色 | 视角 | 典型发现 |
|------|------|---------|
| AI 执行者 | 拿到文档能不能从零跑通 | 12 步清单跳步 |
| DBA | DDL 质量 | owner_dept_id NULLABLE、索引缺失 |
| 编译验证 | 代码骨架能不能编译 | 28 后端 + 10 前端骨架 bug |
| 资深架构师 | 设计取舍 | 过度设计 / 欠设计 |
| 日常开发者 | 日常使用体验 | API 易用性 |
| 测试专家 | 可测试性 | 测试覆盖盲区 |
| B 端 PM | 功能覆盖度 | Excel 导入导出缺失是 P0 |

## 具体步骤
1. 根据变更类型选择角色清单（specs 用 4 维度，代码用 7 角色走查，或按需裁剪）
2. 并行 dispatch agent，每个 agent 只负责自己的维度
3. 汇总去重，按 Critical/Major/Minor 分级
4. Critical 必须当场修
5. 修复后回写审查报告标记已修复（参见全局 rules: review-report-sync）
