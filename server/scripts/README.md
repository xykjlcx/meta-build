# server/scripts

这里放的是**后端入口级脚本**，服务于“交付入口”而不是临时命令收藏。

## 当前脚本

### `mvn-test.sh`

用途：Maven test 安全 wrapper，拦截 `-pl` 但缺 `-am` 的命令（跨模块 test 必须同时重编依赖，否则读旧 class，见 `docs/rules/maven-reactor-run-pitfall.md`）。

```bash
# 单测某个模块的 class，写法和 ./mvnw 完全一致，但会强制你加 -am
./scripts/mvn-test.sh -pl mb-admin -am test -Dtest=OpenapiSnapshotTest
```

拦截示例：

```bash
$ ./scripts/mvn-test.sh -pl mb-admin test -Dtest=Foo
❌ 拦截：-pl 跨模块操作必须同时 -am（否则依赖模块不重编）
```

### `verify-and-run-admin.sh`

用途：

- 锁定 JDK 21
- 以 `mb-admin` 为目标入口，联带依赖模块执行完整 `verify`
- 启动 `mb-admin` fat jar

默认语义：

```bash
cd server
./mvnw -pl mb-admin -am verify
java -jar mb-admin/target/mb-admin-0.1.0-SNAPSHOT.jar
```

这不是“快速启动”脚本，而是：

> **验证通过后的正式启动入口**

示例：

```bash
cd server
./scripts/verify-and-run-admin.sh
```

临时改端口：

```bash
cd server
SERVER_PORT=18080 ./scripts/verify-and-run-admin.sh
```

## 约定

- 正式入口脚本默认必须保留完整验证链，不能偷偷 `-DskipTests`
- 如果以后需要更快的本地回路，新增 `dev-*` 或 `fast-*` 脚本，不要污染正式入口
- 如果未来拆出 `mb-mini-api` / `mb-ios-api` 这类新后端入口，按同样模式新增：
  - `verify-and-run-mini-api.sh`
  - `verify-and-run-ios-api.sh`

## 为什么不用 `mvn spring-boot:run`

当前 reactor 下：

- `mvn spring-boot:run -pl mb-admin` 会因为本地模块依赖未解析而失败
- `mvn -pl mb-admin -am spring-boot:run` 会把插件落到聚合根，找不到 main class

因此当前仓库的稳定策略是：

> **`verify` 产出 fat jar，再启动 fat jar**
