---
title: 契约变更按固定顺序收尾
type: playbook
triggers: [OpenAPI, orval, DTO 重命名, 契约变更, api-sdk, 前后端同步, springdoc]
scope: [流程, 全栈]
---

# 契约变更按固定顺序收尾

## 模式
后端 API 契约有变动时，收尾顺序必须固定，不能编译一绿就停。标准顺序是：

1. 后端全量 `mvn clean verify`
2. 实际启动应用
3. 从**真实配置路径**导出 OpenAPI
4. 前端重生 `api-sdk`
5. 前端跑类型检查
6. 扫描 docs / generated / handoff 残留
7. 再做最终验证

## 适用场景
- DTO / API 包结构重命名
- OpenAPI schema 名称变化
- API 路径 / 响应格式 / controller tag 变化
- springdoc / orval / generated SDK 相关修改

## 具体步骤

1. **先让后端代码本身全绿**
   `cd server && mvn clean verify`

2. **实际启动，不靠脑补**
   不要假设 `springdoc` 路径是默认值，先读实际配置，再启动应用确认

3. **从真实运行中的应用导出 OpenAPI**
   例如当前仓库不是 `/v3/api-docs`，而是 `/api-docs`

4. **基于最新契约重生前端 SDK**
   `pnpm -C client generate:api-sdk`

5. **立刻跑前端类型检查**
   `pnpm -C client check:types`

6. **扫残留**
   包括：
   - 旧 DTO 名称
   - 旧路径
   - docs/specs/handoff 中的旧 prompt

7. **最后再做一次最终验证**
   避免“中间某步改完后又引入新漂移”

## 效果数据
2026-04-16 后端大规模 DTO 重命名 + domain 分包 + i18n 下沉的收尾，就是靠这套顺序把问题一层层剥出来：

- 先发现 `/v3/api-docs` 用错，实际应走 `/api-docs`
- 再发现前端 generated 需要重生
- 最后把 docs 残留一起扫干净

如果顺序打乱，问题会叠在一起，很难判断到底是后端没改对、springdoc 没扫到，还是前端 SDK 还没更新。
