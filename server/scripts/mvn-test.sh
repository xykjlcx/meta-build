#!/usr/bin/env bash
# Maven test 安全 wrapper
#
# 本项目 reactor 下，只要 `-pl` 指定单/多个模块跑 test，就**必须**同时 `-am`
# 把依赖模块也重新编译，否则 target/classes 的 class 可能是旧版本，表现为：
# - 新加的 @ExceptionHandler / @Component / @Bean 没被注册
# - refactor 之后的方法签名没生效、测试用的是旧逻辑
# - 谁改了 infra-* 模块，上层 mb-admin 测试仍读旧 jar
#
# 见 docs/rules/maven-reactor-run-pitfall.md。
#
# 这个脚本在检测到 `-pl` 但缺 `-am` 时硬失败，不替你加（不替你做判断），
# 你要自己决定加 `-am` 还是切换成 `./mvnw verify`。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

args=("$@")

has_pl=false
has_am=false
for arg in "${args[@]}"; do
  case "$arg" in
    -pl|--projects) has_pl=true ;;
    -am|--also-make) has_am=true ;;
  esac
done

if $has_pl && ! $has_am; then
  echo "❌ 拦截：-pl 跨模块操作必须同时 -am（否则依赖模块不重编）"
  echo ""
  echo "   你给的命令：./mvnw ${args[*]}"
  echo "   正确写法：  ./mvnw ${args[*]/-pl/-pl -am}"  # 仅提示
  echo ""
  echo "   背景：docs/rules/maven-reactor-run-pitfall.md"
  echo "        Maven reactor 下，改了 infra-* / platform-* 模块后，"
  echo "        mb-admin 的 target/classes 不会自动重新编依赖，"
  echo "        跑出来的 context 里是旧 class，测试假通过 / 假失败。"
  exit 2
fi

cd "$SERVER_DIR"
exec ./mvnw "${args[@]}"
