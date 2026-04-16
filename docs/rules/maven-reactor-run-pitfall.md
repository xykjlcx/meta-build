---
title: Maven reactor 命令不能靠猜
type: pitfall
triggers: [mvn spring-boot:run, ./mvnw verify, -pl, -am, -rf, --resume-from, reactor, 启动, 验证, mb-admin, Maven 多模块]
scope: [构建, 部署, 流程]
---

# Maven reactor 命令不能靠猜

## 规则
在 meta-build 这种 Maven 多模块项目里，**不要凭经验猜 reactor 参数组合**。这条规则不仅约束 `spring-boot:run`，也约束 `verify`、`-rf/--resume-from` 这类“看起来能省时间”的快捷命令。

稳定路径只有两条：

- **纯验证**：`cd server && ./mvnw verify`
- **验证后启动 admin**：`cd server && ./scripts/verify-and-run-admin.sh`

当前仓库的稳定启动验收方式是：

```bash
cd server
./scripts/verify-and-run-admin.sh
```

它的底层语义是：

```bash
./mvnw -pl mb-admin -am verify
java -jar mb-admin/target/mb-admin-0.1.0-SNAPSHOT.jar
```

在没有修复 Maven 插件配置前：

- 不把 `mvn spring-boot:run -pl mb-admin` 或 `mvn -pl mb-admin -am spring-boot:run` 当作标准启动命令
- 不把 `./mvnw verify -rf :mb-admin` 这类 resume-from 命令当作标准验收命令

## Why

### 具体事件
2026-04-16 后端底座打磨会话里，这个问题再次暴露，而且是两种经典失败同时出现：

- `mvn spring-boot:run -pl mb-admin`
  失败原因：只选中了 `mb-admin`，但像 `infra-web` 这样的 reactor 依赖没有被联带构建，也不在本地仓库里，导致依赖解析失败。

- `mvn -pl mb-admin -am spring-boot:run`
  失败原因：`spring-boot:run` 被执行到聚合根 `meta-build`，而聚合根是 `pom` 包，没有 main class，插件直接报错。

- `./mvnw verify -rf :mb-admin`
  失败原因：resume-from 跳过了前面 reactor 模块的本次构建过程，`mb-admin` 重新解析依赖时拿不到当前轮次上游 snapshot，导致依赖解析失败。

这说明问题不在“记错一个参数”，而在于：

> **Maven reactor 里的“选择模块”和“插件实际执行落点”是两套机制，不能靠经验脑补。**

### 根因模式
- `-pl` 解决的是“选哪些模块”
- `-am` 解决的是“是否把依赖模块一起带上”
- `-rf/--resume-from` 解决的是“从哪个 reactor 节点继续”
- 但 `spring-boot:run` 是 Maven 插件目标，**插件落在哪个项目执行**，不一定符合人的直觉
- 而 `-rf` 是否真的能续跑成功，取决于**当前轮次**上游模块是否已经以可解析状态存在，不是“看名字像断点续传”就一定可靠

所以“上次好像是加 am”“我记得应该是 pl”“这里直接 -rf 应该更快”这类记忆在多模块 reactor 场景里都不可靠。

## How to apply
- 凡是要写 reactor 命令，先在当前仓库实际运行一遍，不要照搬别的项目经验。
- 做后端验收时，默认回到标准命令：`cd server && ./mvnw verify`。
- `-rf/--resume-from` 只允许作为**个人本地临时提速实验**，不能写进文档、计划、提交说明、对用户的进度汇报，更不能当作“已验证完成”的依据。
- 即使某次本地临时续跑成功，交付前仍必须重新跑一遍完整 `./mvnw verify`。
- 如果用户要求“验证启动成功”，优先用正式脚本 `server/scripts/verify-and-run-admin.sh`，或者执行它背后的 `verify + fat jar` 两段式。
- 如果一定要用 `spring-boot:run`，先单独验证它在当前 reactor 下是否真的可用，再写入文档或计划。
- 文档里出现 `mvn spring-boot:run -pl ...` / `-am` / `-rf` 这类命令时，要把“是否已在当前仓库验证过”当成 review 检查项。
- 如果发现标准流程之外的 reactor 快捷命令又被人靠记忆写回来了，先修规则库和文档，再讨论是否要从 Maven 配置层彻底修复。
