---
title: ArchUnit 新规则先扫误伤
type: pitfall
triggers: [ArchUnit, 架构规则, false positive, 误伤, 命名规则, should, resideInAPackage]
scope: [后端, 流程]
---

# ArchUnit 新规则先扫误伤

## 规则
新增或收紧 ArchUnit 规则时，**先验证 false positive，再扩大约束范围**。默认优先约束顶层类、明确边界类，不要第一版就把所有嵌套类型一起扫进去。

## Why

### 具体事件
2026-04-16 新增 `ApiNamingRule` 时，第一版规则直接约束 `..api.vo..` 下全部类名后缀，结果误伤了：

- `LoginVo.UserSummary`
- `ServerInfoVo.JvmMemory`
- `ServerInfoVo.CpuInfo`
- `ServerInfoVo.ThreadInfo`
- `ServerInfoVo.DbInfo`

这些都是合法的 `Vo` 内嵌 record，但被 ArchUnit 当成独立违规类，导致 `mvn clean verify` 失败。

这说明：

> **规则“表达得简洁”不等于“表达得准确”。**

ArchUnit 的代价不是“写出来”，而是“写出来后不会误杀合法代码”。

## How to apply
- 新规则第一次落地时，先问自己：会不会误伤内嵌类、匿名类、测试类、生成代码
- 命名类规则默认优先加：
  - `areTopLevelClasses()`
  - 或明确 whitelist / blacklist
- 新规则第一次接入时，先跑：
  - `./mvnw -pl mb-admin test -Dtest=ArchitectureTest`
  - 或直接 `./mvnw clean verify`
- 如果出现误伤，先修规则表达式，再决定是否要修业务代码
- 规则文案里把“例外边界”写清楚，避免下次维护者重复踩坑
