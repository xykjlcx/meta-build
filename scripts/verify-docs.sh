#!/usr/bin/env bash
# verify-docs.sh - meta-build 文档完整性验证
#
# 用途：在 backend-architecture.md 拆分为 backend/ 子目录后，验证：
#   1. 9 个子文件 + README + appendix + 占位页都存在
#   2. CLAUDE.md 不再直接引用 backend-architecture.md 的 §x.y 章节
#   3. CLAUDE.md 只引用 backend/README.md（不知道具体子文件存在）
#   4. 关键概念在新位置仍然存在（方案 E / AuthFacade / 所有 ArchUnit 规则名）
#   5. 旧关键词只在"废弃说明"语境里出现
#   6. README 反向索引的链接里引用的子文件都存在
#
# 不验证 GitHub anchor 的精确性（因为本地无法渲染），但会检查链接的子文件路径有效。

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

ok() {
    echo "  ✓ $1"
    PASS=$((PASS + 1))
}

fail() {
    echo "  ✗ $1"
    FAIL=$((FAIL + 1))
}

section() {
    echo ""
    echo "═══ $1 ═══"
}

# === 1. 文件结构存在性 ===
section "1. 文件结构存在性"

required_files=(
    "docs/specs/backend/README.md"
    "docs/specs/backend/01-module-structure.md"
    "docs/specs/backend/02-infra-modules.md"
    "docs/specs/backend/03-platform-modules.md"
    "docs/specs/backend/04-data-persistence.md"
    "docs/specs/backend/05-security.md"
    "docs/specs/backend/06-api-and-contract.md"
    "docs/specs/backend/07-observability-testing.md"
    "docs/specs/backend/08-archunit-rules.md"
    "docs/specs/backend/09-config-management.md"
    "docs/specs/backend/appendix.md"
    "docs/specs/frontend/README.md"
    "docs/specs/backend-architecture.md"  # 占位页
    "CLAUDE.md"
    "meta-build规划_v1_最终对齐.md"
)

for f in "${required_files[@]}"; do
    if [ -f "$f" ]; then
        ok "$f 存在"
    else
        fail "$f 缺失"
    fi
done

# === 2. 占位页正确 ===
section "2. backend-architecture.md 占位页"

if grep -q "已拆分" docs/specs/backend-architecture.md; then
    ok "占位页含'已拆分'标记"
else
    fail "占位页缺少'已拆分'标记"
fi

if grep -q "backend/README.md" docs/specs/backend-architecture.md; then
    ok "占位页指向 backend/README.md"
else
    fail "占位页未指向 backend/README.md"
fi

# === 3. CLAUDE.md 索引纯净度 ===
section "3. CLAUDE.md 索引纯净度"

# CLAUDE.md 不应再有 §x.y 形式的 backend-architecture.md 引用
if grep -E 'backend-architecture\.md.*§' CLAUDE.md > /dev/null; then
    fail "CLAUDE.md 仍直接引用 backend-architecture.md §x.y 章节"
    grep -nE 'backend-architecture\.md.*§' CLAUDE.md
else
    ok "CLAUDE.md 不再有 backend-architecture.md §x.y 引用"
fi

# CLAUDE.md 不应直接引用具体后端子文件（除了 README.md）
direct_refs=$(grep -oE 'backend/0[1-9]-[a-z-]+\.md' CLAUDE.md | sort -u || true)
if [ -n "$direct_refs" ]; then
    # 允许引用 03-platform-modules.md（新增业务模块快速链接）
    forbidden=$(echo "$direct_refs" | grep -v "03-platform-modules.md" || true)
    if [ -n "$forbidden" ]; then
        fail "CLAUDE.md 直接引用了非 README 的后端子文件: $forbidden"
    else
        ok "CLAUDE.md 只引用 03-platform-modules.md（合法的业务模块快速链接例外）"
    fi
else
    ok "CLAUDE.md 不直接引用任何后端子文件"
fi

# CLAUDE.md 应该引用 backend/README.md
if grep -q 'backend/README.md' CLAUDE.md; then
    ok "CLAUDE.md 引用了 backend/README.md"
else
    fail "CLAUDE.md 未引用 backend/README.md"
fi

# CLAUDE.md 应该引用反向索引 anchor
if grep -q '后端硬约束反向索引' CLAUDE.md; then
    ok "CLAUDE.md 引用了反向索引"
else
    fail "CLAUDE.md 未引用反向索引"
fi

# === 4. 方案 E 关键词在 05-security.md ===
section "4. 方案 E 关键词在 05-security.md"

scheme_e_keywords=(
    "DataScopeRegistry"
    "DataScopeVisitListener"
    "BypassDataScopeAspect"
    "DataScopeLoader"
    "NO_RAW_SQL_FETCH"
    "@PlainSQL"
    "DataScopeConfig"
    "AuthFacade"
    "SaTokenAuthFacade"
    "CurrentUser"
    "ADR-0007"
)

for kw in "${scheme_e_keywords[@]}"; do
    if grep -q "$kw" docs/specs/backend/05-security.md; then
        ok "05-security.md 包含 $kw"
    else
        fail "05-security.md 缺少 $kw"
    fi
done

# === 5. ArchUnit 规则在 08-archunit-rules.md ===
section "5. ArchUnit 规则在 08-archunit-rules.md"

archunit_rules=(
    "DOMAIN_MUST_NOT_USE_JOOQ"
    "CROSS_PLATFORM_ONLY_VIA_API"
    "BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN"
    "ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN"
    "NO_EVICT_ALL_ENTRIES"
    "NO_LOCALDATETIME_IN_API"
    "TRANSACTIONAL_ONLY_IN_SERVICE"
    "GeneralCodingRules"
    "ArchitectureTest"
)

for rule in "${archunit_rules[@]}"; do
    if grep -q "$rule" docs/specs/backend/08-archunit-rules.md; then
        ok "08-archunit-rules.md 包含 $rule"
    else
        fail "08-archunit-rules.md 缺少 $rule"
    fi
done

# === 6. 旧关键词只在废弃说明语境 ===
section "6. 旧关键词只在废弃说明里"

# DataScopedRepository / DataScopeContext 应该只在"废弃说明"语境出现
# 合法语境：反面教材表 / verify 块 / 零魔法示例 / 砍掉的解释 / ADR-0007 引用
LEGIT_PATTERNS='verify\|废弃\|方案 E\|反继承惯性\|砍掉.*基类\|没有.*基类\|没有.*DataScopeContext\|没有 `DataScopeContext\|没有.*ThreadLocal\|不再需要传递\|全局业务态容器\|MyBatis 继承惯性\|纯粹冗余\|来自 Sa-Token session 单一数据源'

bad_hits=$(grep -rn "extends DataScopedRepository\|DataScopedRepository 基类" docs/specs/backend/ 2>/dev/null | \
    grep -v "$LEGIT_PATTERNS" || true)
if [ -n "$bad_hits" ]; then
    fail "DataScopedRepository 出现在非废弃语境:"
    echo "$bad_hits"
else
    ok "DataScopedRepository 只在合法的废弃语境里出现"
fi

bad_ctx_hits=$(grep -rn "DataScopeContext" docs/specs/backend/ 2>/dev/null | \
    grep -v "$LEGIT_PATTERNS" || true)
if [ -n "$bad_ctx_hits" ]; then
    fail "DataScopeContext 出现在非废弃语境:"
    echo "$bad_ctx_hits"
else
    ok "DataScopeContext 只在合法的废弃语境里出现"
fi

# === 7. ADR 交叉引用更新 ===
section "7. ADR 交叉引用更新"

# 7 份 ADR 都应该有"拆分前/已拆分"的注解
adrs=(0001 0002 0003 0004 0005 0006 0007 0008)
for adr in "${adrs[@]}"; do
    file=$(ls docs/adr/${adr}-*.md 2>/dev/null | head -1)
    if [ -n "$file" ]; then
        if grep -q "已拆分\|拆分前" "$file"; then
            ok "ADR-${adr} 含拆分注解"
        else
            fail "ADR-${adr} 缺拆分注解"
        fi
    else
        fail "ADR-${adr} 文件未找到"
    fi
done

# === 8. README 反向索引链接的目标文件存在 ===
section "8. README 反向索引链接的目标文件存在"

# 提取 README 里所有 ./0X-xxx.md 类型的链接
links=$(grep -oE '\./0[1-9]-[a-z-]+\.md|\./appendix\.md' docs/specs/backend/README.md | sort -u || true)
for link in $links; do
    target="docs/specs/backend/${link#./}"
    if [ -f "$target" ]; then
        ok "$link 指向存在的文件"
    else
        fail "$link 指向不存在的文件 $target"
    fi
done

# === 9. 行数粗略平衡 ===
section "9. 行数粗略平衡"

src_lines=$(wc -l < docs/specs/backend-architecture.md)
new_lines=$(cat docs/specs/backend/*.md | wc -l)

# 占位页应该 < 50 行
if [ "$src_lines" -lt 50 ]; then
    ok "占位页 backend-architecture.md ($src_lines 行) < 50 行（已变占位）"
else
    fail "占位页 $src_lines 行过大，可能未真正变成占位"
fi

# 新文件总行数应该 >= 3500 行（覆盖原 4071 行的内容 + 一些骨架补充）
if [ "$new_lines" -gt 3500 ]; then
    ok "backend/ 子文件总行数 $new_lines >= 3500"
else
    fail "backend/ 子文件总行数 $new_lines < 3500，可能内容缺失"
fi

# === 10. 前端 README 占位 ===
section "10. 前端 README 占位"

if grep -q "M0 待写" docs/specs/frontend/README.md; then
    ok "frontend/README.md 标明 M0 待写"
else
    fail "frontend/README.md 未标明 M0 待写"
fi

# === 总结 ===
echo ""
echo "═══════════════════════"
echo "  通过: $PASS"
echo "  失败: $FAIL"
echo "═══════════════════════"

if [ "$FAIL" -gt 0 ]; then
    exit 1
else
    echo "  ✅ docs verify 全绿"
    exit 0
fi
