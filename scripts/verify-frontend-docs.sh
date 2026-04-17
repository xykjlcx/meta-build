#!/usr/bin/env bash
# verify-frontend-docs.sh - meta-build 前端 spec 文档完整性验证
#
# 用途：验证 docs/specs/frontend/ 下的前端架构文档的完整性和一致性
#   1. 13 个文件（README + 11 内容 + appendix）都存在
#   2. 每个子文件顶部有"关注点"引言块
#   3. 每个子文件末尾有"返回 README"back-link
#   4. 每个子文件有 milestone 标签 + verify 块
#   5. 无 placeholder 残留（TBD / 待补 / 占位 / FIXME / XXX / // TODO）
#   6. 13 条硬约束 + 2 条推荐的关键词在 10-quality-gates.md 全部出现
#   7. 双树架构关键词在 07-menu-permission.md 出现
#   8. i18n 工程关键词在 05-app-shell.md 出现
#   9. api-sdk / ProblemDetail / PageResult 关键词在 08-contract-client.md 出现
#  10. 反向索引链接的目标文件存在
#  11. 废弃关键词已清理（is_deleted / 软删除 已改名为 is_stale / stale）
#  12. 行数粗略平衡（>= 6000 行）
#
# 不验证 GitHub anchor 的精确性（本地无法渲染），但会检查相对路径链接的目标文件存在。

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
    "docs/specs/frontend/README.md"
    "docs/specs/frontend/01-layer-structure.md"
    "docs/specs/frontend/02-ui-tokens-theme.md"
    "docs/specs/frontend/03-ui-primitives.md"
    "docs/specs/frontend/04-ui-patterns.md"
    "docs/specs/frontend/05-app-shell.md"
    "docs/specs/frontend/06-routing-and-data.md"
    "docs/specs/frontend/07-menu-permission.md"
    "docs/specs/frontend/08-contract-client.md"
    "docs/specs/frontend/09-customization-workflow.md"
    "docs/specs/frontend/10-quality-gates.md"
    "docs/specs/frontend/11-antipatterns.md"
    "docs/specs/frontend/appendix.md"
)

for f in "${required_files[@]}"; do
    if [ -f "$f" ]; then
        ok "$f 存在"
    else
        fail "$f 缺失"
    fi
done

# === 2. 格式合规（关注点引言 + back-link + milestone + verify）===
section "2. 格式合规"

content_files=(
    "docs/specs/frontend/01-layer-structure.md"
    "docs/specs/frontend/02-ui-tokens-theme.md"
    "docs/specs/frontend/03-ui-primitives.md"
    "docs/specs/frontend/04-ui-patterns.md"
    "docs/specs/frontend/05-app-shell.md"
    "docs/specs/frontend/06-routing-and-data.md"
    "docs/specs/frontend/07-menu-permission.md"
    "docs/specs/frontend/08-contract-client.md"
    "docs/specs/frontend/09-customization-workflow.md"
    "docs/specs/frontend/10-quality-gates.md"
    "docs/specs/frontend/11-antipatterns.md"
)

for f in "${content_files[@]}"; do
    name=$(basename "$f")
    # 2.1 顶部有"关注点"引言
    if head -5 "$f" 2>/dev/null | grep -q "关注点"; then
        ok "$name: 顶部有'关注点'引言块"
    else
        fail "$name: 顶部缺'关注点'引言块"
    fi

    # 2.2 末尾有"返回 README"back-link
    if tail -3 "$f" 2>/dev/null | grep -q "返回 README"; then
        ok "$name: 末尾有'返回 README' back-link"
    else
        fail "$name: 末尾缺'返回 README' back-link"
    fi

    # 2.3 至少有一个 milestone 标签
    if grep -qE '\[M[0-9]\+?\]|\[M[0-9]\+M[0-9]\]' "$f" 2>/dev/null; then
        ok "$name: 有 milestone 标签"
    else
        fail "$name: 缺 milestone 标签"
    fi

    # 2.4 至少有一个 verify 块
    if grep -q "<!-- verify:" "$f" 2>/dev/null; then
        ok "$name: 有 verify 块"
    else
        fail "$name: 缺 verify 块"
    fi
done

# === 3. Placeholder 扫描 ===
section "3. Placeholder 扫描（应零匹配）"

# 严格扫描：TBD / FIXME / XXX / [待补] / [占位] / // TODO / <!-- TODO
# 合法例外：M* 时补 / 内容里谈论 // TODO 概念（作为反面教材）
bad_placeholders=$(grep -rEn '\bTBD\b|\bFIXME\b|\[待补\]|\[占位\]|\[TODO\]' docs/specs/frontend/ 2>/dev/null | grep -v 'M[0-9] 时补' || true)
if [ -n "$bad_placeholders" ]; then
    fail "发现 placeholder 残留："
    echo "$bad_placeholders"
else
    ok "无 TBD/FIXME/XXX/待补/占位 残留"
fi

# // TODO 扫描（排除合法的"不要 // TODO 占位"约束文案 + 流程说明）
bad_todo=$(grep -rn '// TODO\|<!-- TODO' docs/specs/frontend/ 2>/dev/null | \
    grep -v '不要 // TODO\|// TODO 占位\|// TODO 注释\|// TODO 标记\|加 TODO issue' || true)
if [ -n "$bad_todo" ]; then
    fail "发现 // TODO / <!-- TODO 残留："
    echo "$bad_todo"
else
    ok "无 // TODO / <!-- TODO 残留（排除合法提及）"
fi

# === 4. 13 条硬约束 + 2 条推荐的关键词在 10-quality-gates.md ===
section "4. 13 条硬约束 + 2 条推荐的关键词在 10-quality-gates.md"

quality_gates_keywords=(
    # MUST NOT 6 条 + RECOMMENDED 2 条
    "硬编码颜色"
    "反向 import"
    "白名单"
    "api-sdk/auth"
    "routes/**/*.tsx"
    "ui-tokens"
    "扁平命名"
    "动态拼接"
    # MUST 7 条
    "Storybook"
    "主题完整性"
    "requireAuth"
    "@mb/api-sdk"
    "Tailwind 语义"
    "i18n"
    "env.example"
)

for kw in "${quality_gates_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/10-quality-gates.md 2>/dev/null; then
        ok "10-quality-gates.md 包含 $kw"
    else
        fail "10-quality-gates.md 缺少 $kw"
    fi
done

# === 5. 双树架构关键词在 07-menu-permission.md ===
section "5. 双树架构关键词在 07-menu-permission.md"

dual_tree_keywords=(
    "mb_iam_route_tree"
    "mb_iam_menu"
    "route_ref_id"
    "AppPermission"
    "useMenu"
    "RouteTreeSyncRunner"
    "meta.buttons"
    "parent_code"
    "禁止退化为单表"
    "action 词表"
)

for kw in "${dual_tree_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/07-menu-permission.md 2>/dev/null; then
        ok "07-menu-permission.md 包含 $kw"
    else
        fail "07-menu-permission.md 缺少 $kw"
    fi
done

# === 6. i18n 工程关键词在 05-app-shell.md ===
section "6. i18n 工程关键词在 05-app-shell.md"

i18n_keywords=(
    "i18n-instance"
    "useLanguage"
    "fallbackLng"
    "Accept-Language"
    "module augmentation"
    "import.meta.glob"
    "addResourceBundle"
    "数据库数据不走 i18n"
)

for kw in "${i18n_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/05-app-shell.md 2>/dev/null; then
        ok "05-app-shell.md 包含 $kw"
    else
        fail "05-app-shell.md 缺少 $kw"
    fi
done

# === 7. 契约驱动关键词在 08-contract-client.md ===
section "7. 契约驱动关键词在 08-contract-client.md"

contract_keywords=(
    "@mb/api-sdk"
    "ProblemDetail"
    "PageResult"
    "springdoc"
    "OpenAPI"
    "X-Request-ID"
)

for kw in "${contract_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/08-contract-client.md 2>/dev/null; then
        ok "08-contract-client.md 包含 $kw"
    else
        fail "08-contract-client.md 缺少 $kw"
    fi
done

# === 8. 5 层结构关键词在 01-layer-structure.md ===
section "8. 5 层结构关键词在 01-layer-structure.md"

layer_keywords=(
    "@mb/ui-tokens"
    "@mb/ui-primitives"
    "@mb/ui-patterns"
    "@mb/app-shell"
    "web-admin"
    "pnpm-workspace"
    "dependency-cruiser"
    "脚手架"
)

for kw in "${layer_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/01-layer-structure.md 2>/dev/null; then
        ok "01-layer-structure.md 包含 $kw"
    else
        fail "01-layer-structure.md 缺少 $kw"
    fi
done

# === 9. 主题 token 关键词在 02-ui-tokens-theme.md ===
section "9. 主题关键词在 02-ui-tokens-theme.md"

theme_keywords=(
    "--color-primary"
    "--radius"
    "data-theme-style"
    "data-theme-color-mode"
    "Style Registry"
    "完整性校验"
    "CSS Variables"
    "扁平命名"
)

for kw in "${theme_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/02-ui-tokens-theme.md 2>/dev/null; then
        ok "02-ui-tokens-theme.md 包含 $kw"
    else
        fail "02-ui-tokens-theme.md 缺少 $kw"
    fi
done

# shell-redesign-spec.md 已在 Phase D 删除，不允许回流到 canonical 目录
shell_redesign_spec="docs/specs/frontend/shell-redesign-spec.md"
if [ -f "$shell_redesign_spec" ]; then
    fail "shell-redesign-spec.md 不应再存在于 docs/specs/frontend/"
else
    ok "shell-redesign-spec.md 已从 canonical 目录移除"
fi

# === 9B. 旧概念残留扫描（canonical 入口应零匹配） ===
section "9B. 旧概念残留扫描（canonical 入口应零匹配）"

old_concept_files=(
    "docs/specs/frontend/README.md"
    "docs/specs/frontend/01-layer-structure.md"
    "docs/specs/frontend/02-ui-tokens-theme.md"
    "docs/specs/frontend/06-routing-and-data.md"
    "docs/specs/frontend/07-menu-permission.md"
    "docs/specs/frontend/09-customization-workflow.md"
    "docs/specs/frontend/10-quality-gates.md"
    "docs/specs/frontend/appendix.md"
)

bad_old_concepts=$(rg -n '\bThemeProvider\b|\buseTheme\b|\bthemeRegistry\b|Theme Registry|\bThemeSwitcher\b|\binitTheme\s*\(|data-theme=' "${old_concept_files[@]}" 2>/dev/null || true)
if [ -n "$bad_old_concepts" ]; then
    fail "发现旧主题概念残留（ThemeProvider/useTheme/themeRegistry 等）："
    echo "$bad_old_concepts"
else
    ok "canonical 入口无旧主题概念残留"
fi

bad_old_layout_concepts=$(rg -n '\bSidebarLayout\b|\bTopLayout\b' "${old_concept_files[@]}" 2>/dev/null || true)
if [ -n "$bad_old_layout_concepts" ]; then
    fail "发现旧布局概念残留（SidebarLayout/TopLayout）："
    echo "$bad_old_layout_concepts"
else
    ok "canonical 入口无旧布局概念残留"
fi

# === 9C. v2 核心概念守护（05-app-shell.md） ===
section "9C. v2 核心概念守护（05-app-shell.md）"

shell_v2_keywords=(
    "LayoutResolver"
    "Preset Registry"
    "StyleProvider"
    "inset"
    "mix"
)

for kw in "${shell_v2_keywords[@]}"; do
    if grep -qF -- "$kw" docs/specs/frontend/05-app-shell.md 2>/dev/null; then
        ok "05-app-shell.md 包含 $kw"
    else
        fail "05-app-shell.md 缺少 $kw"
    fi
done

# === 10. 反向索引链接的目标文件存在 ===
section "10. README 导航链接有效"

links=$(grep -oE '\./0[0-9]+-[a-z-]+\.md|\./appendix\.md' docs/specs/frontend/README.md 2>/dev/null | sort -u || true)
for link in $links; do
    target="docs/specs/frontend/${link#./}"
    if [ -f "$target" ]; then
        ok "$link 指向存在的文件"
    else
        fail "$link 指向不存在的文件 $target"
    fi
done

# === 11. 废弃关键词已清理（is_deleted / 软删除 → is_stale / stale）===
section "11. 废弃关键词已清理（M4.2 对齐：后端已去软删除）"

# 11.1 is_deleted 字段应该完全改名为 is_stale
bad_is_deleted=$(grep -rn 'is_deleted\|isDeleted' docs/specs/frontend/ 2>/dev/null || true)
if [ -n "$bad_is_deleted" ]; then
    fail "发现 is_deleted / isDeleted 残留（应改为 is_stale / isStale）："
    echo "$bad_is_deleted"
else
    ok "无 is_deleted / isDeleted 残留"
fi

# 11.2 "软删除"关键词应该完全清理（除了合法的反面教材引用）
# 合法语境：反面教材 / 后端已去 / 不做 / 历史 / nxboot
SOFT_DELETE_LEGIT='反面教材\|后端已去\|后端.*去除\|不做\|历史\|nxboot\|已废弃\|概念重写\|废弃'
bad_soft_delete=$(grep -rn '软删除\|soft delete\|soft_delete' docs/specs/frontend/ 2>/dev/null | \
    grep -v "$SOFT_DELETE_LEGIT" || true)
if [ -n "$bad_soft_delete" ]; then
    fail "发现'软删除'残留（非合法废弃语境）："
    echo "$bad_soft_delete"
else
    ok "无'软删除'残留（或只在合法废弃语境）"
fi

# 11.3 WHERE deleted = 0 类的 SQL 模式应清理
bad_deleted_sql=$(grep -rn 'deleted = 0\|deleted = 1\|deleted = FALSE\|deleted = TRUE' docs/specs/frontend/ 2>/dev/null || true)
if [ -n "$bad_deleted_sql" ]; then
    fail "发现 'deleted = 0/1' SQL 模式残留："
    echo "$bad_deleted_sql"
else
    ok "无 'deleted = 0/1' SQL 模式残留"
fi

# === 12. 行数粗略平衡 ===
section "12. 行数粗略平衡"

total_lines=$(cat docs/specs/frontend/*.md 2>/dev/null | wc -l)

if [ "$total_lines" -gt 6000 ]; then
    ok "前端 spec 总行数 $total_lines > 6000"
else
    fail "前端 spec 总行数 $total_lines < 6000，可能内容不足"
fi

# 每个内容文件至少 200 行（骨架最少阈值）
for f in "${content_files[@]}"; do
    name=$(basename "$f")
    lines=$(wc -l < "$f" 2>/dev/null || echo 0)
    if [ "$lines" -gt 200 ]; then
        ok "$name: $lines 行 > 200"
    else
        fail "$name: $lines 行 < 200（内容过少）"
    fi
done

# === 总结 ===
echo ""
echo "═══════════════════════"
echo "  通过: $PASS"
echo "  失败: $FAIL"
echo "═══════════════════════"

if [ "$FAIL" -gt 0 ]; then
    exit 1
else
    echo "  ✅ frontend docs verify 全绿"
    exit 0
fi
