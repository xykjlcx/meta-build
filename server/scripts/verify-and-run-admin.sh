#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" ]] && [[ -x "${JAVA_HOME}/bin/java" ]]; then
    local current_major
    current_major="$("${JAVA_HOME}/bin/java" -version 2>&1 | awk -F '[\".]' '/version/ {print $2; exit}')"
    if [[ "${current_major}" == "21" ]]; then
      printf '%s\n' "${JAVA_HOME}"
      return 0
    fi
  fi

  if [[ -d "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ]]; then
    printf '%s\n' "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
    return 0
  fi

  local cellar_home=""
  cellar_home="$(ls -d /opt/homebrew/Cellar/openjdk@21/*/libexec/openjdk.jdk/Contents/Home 2>/dev/null | sort | tail -n 1 || true)"
  if [[ -n "${cellar_home}" ]]; then
    printf '%s\n' "${cellar_home}"
    return 0
  fi

  if [[ -x /usr/libexec/java_home ]]; then
    local detected
    detected="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
    if [[ -n "${detected}" ]] && [[ -x "${detected}/bin/java" ]]; then
      local detected_major
      detected_major="$("${detected}/bin/java" -version 2>&1 | awk -F '[\".]' '/version/ {print $2; exit}')"
      if [[ "${detected_major}" == "21" ]]; then
        printf '%s\n' "${detected}"
        return 0
      fi
    fi
  fi

  return 1
}

JAVA_HOME="$(resolve_java_home || true)"

if [[ -z "${JAVA_HOME:-}" ]]; then
  echo "未找到 JDK 21，请先设置 JAVA_HOME 或安装 openjdk@21" >&2
  exit 1
fi

export JAVA_HOME

JAVA_MAJOR="$("${JAVA_HOME}/bin/java" -version 2>&1 | awk -F '[\".]' '/version/ {print $2; exit}')"
if [[ "${JAVA_MAJOR}" != "21" ]]; then
  echo "检测到的 JAVA_HOME 不是 JDK 21: ${JAVA_HOME}" >&2
  exit 1
fi

cd "${SERVER_DIR}"

# 默认走完整验证链，保证启动的是已通过验证的产物。
# 如需纯本地调试提速，应另建明确降级语义的 dev 脚本，而不是在正式启动脚本里默认跳过测试。
./mvnw -pl mb-admin -am verify

JAVA_ARGS=()
if [[ -n "${SERVER_PORT:-}" ]]; then
  JAVA_ARGS+=("--server.port=${SERVER_PORT}")
fi

exec "${JAVA_HOME}/bin/java" -jar "${SERVER_DIR}/mb-admin/target/mb-admin-0.1.0-SNAPSHOT.jar" "${JAVA_ARGS[@]}"
