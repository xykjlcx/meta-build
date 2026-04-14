---
title: 前后端联查
type: pitfall
triggers: [API 契约, DTO, 认证, 权限点, 表结构, token, 前后端同步, api-sdk]
scope: [全栈]
---

# 前后端联查

## 规则
后端改了 API 契约（DTO 结构、认证方式、权限点格式、表结构）相关内容时，必须联查前端 specs 是否需要同步。反之亦然。

## Why
2026-04-13 前后端联查发现 6C + 6I + 4M 的问题：前端 sys_iam_* 表名残留（后端已改 mb_iam_*）、LoginResult 单 token vs 双 token 不一致、权限点格式 drift。这些问题都是后端改了但没联查前端导致的，每个都会在 M1 编码时造成编译或运行时错误。

## How to apply
- 后端改了以下任一项 → 联查前端 specs：
  - 表名/字段名（影响前端类型定义）
  - DTO 结构（影响 api-sdk）
  - 认证方式/Token 结构（影响登录流程）
  - 权限点格式（影响前端权限守卫）
  - API 路径或响应格式
- 前端改了路由/菜单/权限体系 → 联查后端 specs（路由树 DDL、权限点枚举）
- **默认操作**：改完后立即 grep 对端 specs 目录中的相关关键词（表名、DTO 名、权限点），确认无 drift。如果改动涉及 ≥3 个契约点，dispatch 独立 agent 做系统性联查
