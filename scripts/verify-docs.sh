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

# === 4.5 M4.2 jOOQ 原生拦截关键词 ===
section "4.5 M4.2 jOOQ 原生拦截关键词在 04-data-persistence.md"

m42_keywords=(
    "executeWithOptimisticLocking"
    "updateRecordVersion"
    "updateRecordTimestamp"
    "RecordListener"
    "AuditFieldsRecordListener"
    "DataChangedException"
    "batchInsert"
    "batchUpdate"
    "conditionalUpdate"
    "SYSTEM_USER_ID"
)

for kw in "${m42_keywords[@]}"; do
    if grep -q "$kw" docs/specs/backend/04-data-persistence.md; then
        ok "04-data-persistence.md 包含 $kw"
    else
        fail "04-data-persistence.md 缺少 $kw"
    fi
done

# === 4.6 M4.3 分页契约关键词 ===
section "4.6 M4.3 分页契约关键词在 06-api-and-contract.md"

m43_keywords=(
    "PageQuery"
    "PageResult"
    "SortParser"
    "forTable"
    "PageQueryArgumentResolver"
    "mb.api.pagination"
)

for kw in "${m43_keywords[@]}"; do
    if grep -q "$kw" docs/specs/backend/06-api-and-contract.md; then
        ok "06-api-and-contract.md 包含 $kw"
    else
        fail "06-api-and-contract.md 缺少 $kw"
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

# M4.2: softDeletedFilter / setAuditInsert / setAuditUpdate 只应出现在"废弃/砍掉/改造"合法语境
M42_LEGIT='废弃\|砍掉\|被.*替代\|不应存在\|全部砍掉\|改造\|改为\|反面教材\|概念重写\|nxboot\|已废弃\|不做'

bad_soft=$(grep -rn "softDeletedFilter\|setAuditInsert\|setAuditUpdate" docs/specs/backend/ 2>/dev/null | \
    grep -v "$M42_LEGIT" || true)
if [ -n "$bad_soft" ]; then
    fail "softDeletedFilter/setAuditInsert/setAuditUpdate 出现在非废弃语境:"
    echo "$bad_soft"
else
    ok "softDeletedFilter/setAuditInsert/setAuditUpdate 只在合法的废弃语境里出现"
fi

# === 7. ADR 交叉引用更新 ===
section "7. ADR 交叉引用更新"

# 7 份 ADR 都应该有"拆分前/已拆分"的注解
adrs=(0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012)
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

# === 10. 前端文档检查 ===
# 说明:前端文档由独立会话维护,本脚本不再检查前端文档的具体状态。
# 如需前端文档完整性检查,应创建独立的 verify-frontend-docs.sh。

# === 4.7 N3 域模型规范关键词 ===
section "4.7 N3 域模型规范关键词在 01-module-structure.md"

n3_keywords=(
    "Domain Model"
    "DSLCONTEXT_ONLY_IN_REPOSITORY"
    "UserApi"
    "编排 Service"
    "from(MbIamUserRecord)"
)

for kw in "${n3_keywords[@]}"; do
    if grep -q "$kw" docs/specs/backend/01-module-structure.md; then
        ok "01-module-structure.md 包含 $kw"
    else
        fail "01-module-structure.md 缺少 $kw"
    fi
done

# === 4.8 C2 编码风格契约关键词 ===
section "4.8 C2 编码风格契约关键词在 08-archunit-rules.md"

c2_keywords=(
    "编码风格契约"
    "NO_MAPSTRUCT"
    "OPTIONAL_ONLY_RETURN"
    "ONLY_JAKARTA_NULLABLE"
    "virtual thread"
    "pinning"
)

for kw in "${c2_keywords[@]}"; do
    if grep -q "$kw" docs/specs/backend/08-archunit-rules.md; then
        ok "08-archunit-rules.md 包含 $kw"
    else
        fail "08-archunit-rules.md 缺少 $kw"
    fi
done

# 检查 05-security.md 包含 @RequirePermission Controller 层规范
if grep -q "@RequirePermission.*必须放在 Controller 层" docs/specs/backend/05-security.md; then
    ok "05-security.md 明确 @RequirePermission 放 Controller 层"
else
    fail "05-security.md 未明确 @RequirePermission 放 Controller 层"
fi

# === 10.1 M0 Review 翻转决策：正向关键词存在性（ADR-0009~0012）===
section "10.1 M0 Review 翻转决策正向关键词（ADR-0009~0012）"

# ADR-0009: mb_ 前缀
if grep -q "mb_iam_user" docs/specs/backend/04-data-persistence.md; then
    ok "04-data-persistence.md 使用 mb_iam_user 表名"
else
    fail "04-data-persistence.md 缺少 mb_iam_user 表名"
fi

if grep -q "mb_operation_log" docs/specs/backend/04-data-persistence.md; then
    ok "04-data-persistence.md 使用 mb_operation_log 表名"
else
    fail "04-data-persistence.md 缺少 mb_operation_log 表名"
fi

if grep -q "mb_iam_user" docs/specs/backend/05-security.md; then
    ok "05-security.md 使用 mb_iam_user 表名"
else
    fail "05-security.md 缺少 mb_iam_user 表名"
fi

# ADR-0010: @OperationLog + platform-oplog
if grep -q "@OperationLog" docs/specs/backend/01-module-structure.md; then
    ok "01-module-structure.md 包含 @OperationLog"
else
    fail "01-module-structure.md 缺少 @OperationLog"
fi

if grep -q "platform-oplog" docs/specs/backend/01-module-structure.md; then
    ok "01-module-structure.md 包含 platform-oplog"
else
    fail "01-module-structure.md 缺少 platform-oplog"
fi

if grep -q "platform-oplog" docs/specs/backend/03-platform-modules.md; then
    ok "03-platform-modules.md 包含 platform-oplog"
else
    fail "03-platform-modules.md 缺少 platform-oplog"
fi

if grep -q "@OperationLog" docs/specs/backend/05-security.md; then
    ok "05-security.md 包含 @OperationLog"
else
    fail "05-security.md 缺少 @OperationLog"
fi

# ADR-0011: version 按需
if grep -q "按需添加" docs/specs/backend/04-data-persistence.md; then
    ok "04-data-persistence.md 包含 version 按需添加"
else
    fail "04-data-persistence.md 缺少 version 按需添加说明"
fi

# ADR-0012: Clock Bean 编码建议（已从 ArchUnit 硬规则降级为文档引导）
if grep -q "Clock Bean" docs/specs/backend/08-archunit-rules.md; then
    ok "08-archunit-rules.md 包含 Clock Bean 编码建议"
else
    fail "08-archunit-rules.md 缺少 Clock Bean 编码建议"
fi

if grep -q "Clock" docs/specs/backend/04-data-persistence.md; then
    ok "04-data-persistence.md 包含 Clock Bean 时间策略"
else
    fail "04-data-persistence.md 缺少 Clock Bean 时间策略"
fi

if grep -q "Clock.systemUTC" docs/specs/backend/08-archunit-rules.md; then
    ok "08-archunit-rules.md 包含 Clock.systemUTC 示例"
else
    fail "08-archunit-rules.md 缺少 Clock.systemUTC 示例"
fi

# SERVICE_JOOQ_WHITELIST（C8 Review 新增）
if grep -q "SERVICE_JOOQ_WHITELIST" docs/specs/backend/08-archunit-rules.md; then
    ok "08-archunit-rules.md 包含 SERVICE_JOOQ_WHITELIST"
else
    fail "08-archunit-rules.md 缺少 SERVICE_JOOQ_WHITELIST"
fi

# === 10.2 M0 Review 翻转决策：旧关键词零残留 ===
section "10.2 M0 Review 翻转决策旧关键词零残留"

# sys_ 表名零残留（合法语境：ADR 历史引用、"从 sys_ 改为 mb_" 说明性文字）
SYS_LEGIT='ADR-0009\|从 sys_\|sys_ 前缀\|sys_ →\|sys_ 改\|原命名'
bad_sys=$(grep -rn "sys_iam_\|sys_audit_\|sys_operation_\|sys_dict_\|sys_config_\|sys_file_\|sys_notification_\|sys_job_\|sys_monitor_" docs/specs/backend/ 2>/dev/null | \
    grep -v "$SYS_LEGIT" || true)
if [ -n "$bad_sys" ]; then
    fail "sys_ 表名在后端 spec 中有非合法残留:"
    echo "$bad_sys"
else
    ok "sys_ 表名在后端 spec 中零残留"
fi

# @Audit 注解零残留（合法语境：ADR 历史引用、"@Audit → @OperationLog" 说明性文字、审计日志 v1.5 说明）
# 注意：只检查作为 Java 注解的 @Audit，不检查 "audit" 普通英文单词
AUDIT_LEGIT='ADR-0010\|→ @OperationLog\|@Audit →\|原命名\|platform-audit →'
bad_audit=$(grep -rn "@Audit[^F]" docs/specs/backend/ 2>/dev/null | \
    grep -v "$AUDIT_LEGIT" || true)
if [ -n "$bad_audit" ]; then
    fail "@Audit 注解在后端 spec 中有非合法残留:"
    echo "$bad_audit"
else
    ok "@Audit 注解在后端 spec 中零残留"
fi

# platform-audit 模块名零残留（合法语境：ADR 历史引用、重命名说明）
PAUDIT_LEGIT='ADR-0010\|→ platform-oplog\|platform-audit →\|原命名'
bad_paudit=$(grep -rn "platform-audit" docs/specs/backend/ 2>/dev/null | \
    grep -v "$PAUDIT_LEGIT" || true)
if [ -n "$bad_paudit" ]; then
    fail "platform-audit 在后端 spec 中有非合法残留:"
    echo "$bad_paudit"
else
    ok "platform-audit 在后端 spec 中零残留"
fi

# infrastructure 包名零残留（合法语境：说明性文字"不拆 infrastructure"、"去掉 infrastructure"）
INFRA_LEGIT='不拆\|去掉\|infrastructure 残留\|没有 infrastructure\|infrastructure）\|验证.*infrastructure\|无 infrastructure\|Deprecated\|已被.*替代\|@Deprecated\|// .*"\.\.infrastructure\.\."'
bad_infra=$(grep -rn "\.infrastructure\.\|/infrastructure/" docs/specs/backend/ 2>/dev/null | \
    grep -v "$INFRA_LEGIT" || true)
if [ -n "$bad_infra" ]; then
    fail "infrastructure 包名在后端 spec 中有非合法残留:"
    echo "$bad_infra"
else
    ok "infrastructure 包名在后端 spec 中零残留"
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
