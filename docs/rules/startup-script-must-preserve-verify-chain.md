---
title: 正式启动脚本必须保留验证链
type: pitfall
triggers: [启动脚本, run-admin, verify-and-run, skipTests, dev script, 启动验收]
scope: [构建, 部署, 流程]
---

# 正式启动脚本必须保留验证链

## 规则
凡是仓库里的**正式启动入口脚本**，默认行为必须保留完整验证链，不能为了启动方便偷偷加 `-DskipTests`、跳过 ArchUnit、跳过契约生成或跳过必要的构建检查。

如果需要更快的本地开发回路，应该：

- 新建一个**明确降级语义**的 dev 脚本
- 在名字和文档里明确说明“这是跳过部分验证的开发快捷入口”
- 不能把这种降级语义塞进正式启动脚本里

## Why

### 具体事件
2026-04-16 为了解决 Maven reactor 里 `spring-boot:run` 的 `-pl/-am` 启动坑，新增了 `verify-and-run-admin.sh`。第一版脚本默认执行：

```bash
./mvnw -pl mb-admin -am package -DskipTests
java -jar mb-admin/target/mb-admin-0.1.0-SNAPSHOT.jar
```

它能启动，但本质上把“启动便利”放在了“验证链”前面，违反了 meta-build 的核心交付原则：

> **已启动 ≠ 已验证 ≠ 可交付**

meta-build 的目标不是“让服务最快跑起来”，而是“让 AI 按契约跑完整链路后，人第二天验收”。正式入口默认跳过测试，会让团队逐渐把“能起服务”误当成“完成交付”。

### 根因模式
- reactor 启动坑是一个真实问题
- 但“解决 reactor 坑”不等于可以绕过验证链
- 一旦把 `skipTests` 藏进正式脚本，未来大家只会记住脚本名，不会记得它其实跳过了什么

这类问题的危险不在一次错误，而在于它会把错误固化成**默认流程**

## How to apply
- 正式脚本的默认路径应是：`verify/build -> start`
- 如果脚本名带 `verify-and-run` / `start` / `release` / `boot` 这类正式语义，就不允许默认跳过验证
- 需要开发快捷入口时，新建显式的 `dev-*` / `fast-*` 脚本
- Review 启动脚本时，先看里面有没有：
  - `-DskipTests`
  - 绕过 `verify`
  - 绕过契约生成/同步
  - 绕过必要的环境校验
- 文档里的“常用命令”如果引用了正式脚本，默认假设它包含完整验证链
