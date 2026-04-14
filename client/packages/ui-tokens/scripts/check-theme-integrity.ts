/**
 * 主题完整性校验脚本
 * 检查所有主题 CSS 文件是否包含完全一致的变量集合，
 * 并验证变量命名符合 flat naming 规范。
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { themeRegistry } from '../src/theme-registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '../src');

// 命名规范：--<category>-<name>(-<suffix>)*
const NAMING_PATTERN = /^--[a-z]+(-[a-z0-9]+)+$/;

/**
 * 从 CSS 文件中提取所有 --xxx 变量名
 */
function extractVariables(cssContent: string): string[] {
  const vars: string[] = [];
  // 匹配 --xxx-yyy: value 格式的声明
  const regex = /^\s*(--[a-z][a-z0-9-]*)\s*:/gm;
  for (let match = regex.exec(cssContent); match !== null; match = regex.exec(cssContent)) {
    const name = match[1];
    if (name) vars.push(name);
  }
  return vars;
}

let hasError = false;

// 收集所有主题的变量
const themeVarsMap = new Map<string, string[]>();

for (const theme of themeRegistry) {
  const cssPath = resolve(srcDir, theme.cssFile);
  let content: string;
  try {
    content = readFileSync(cssPath, 'utf-8');
  } catch {
    console.error(`[FAIL] 无法读取主题文件: ${theme.id} -> ${cssPath}`);
    hasError = true;
    continue;
  }

  const vars = extractVariables(content);
  themeVarsMap.set(theme.id, vars);

  // 检查命名规范
  const namingViolations = vars.filter((v) => !NAMING_PATTERN.test(v));
  if (namingViolations.length > 0) {
    console.error(`[FAIL] ${theme.id}: 命名违规 ${namingViolations.length} 个:`);
    for (const v of namingViolations) {
      console.error(`  - ${v}`);
    }
    hasError = true;
  }
}

// 以 default 为基准比较
const referenceId = 'default';
const referenceVars = themeVarsMap.get(referenceId);

if (!referenceVars) {
  console.error(`[FAIL] 基准主题 "${referenceId}" 不存在或无法解析`);
  process.exit(1);
}

const referenceSet = new Set(referenceVars);

for (const [themeId, vars] of themeVarsMap) {
  if (themeId === referenceId) continue;

  const currentSet = new Set(vars);

  // 缺失的变量
  const missing = referenceVars.filter((v) => !currentSet.has(v));
  if (missing.length > 0) {
    console.error(`[FAIL] ${themeId}: 缺少 ${missing.length} 个变量（相对 ${referenceId}）:`);
    for (const v of missing) {
      console.error(`  - ${v}`);
    }
    hasError = true;
  }

  // 多余的变量
  const extra = vars.filter((v) => !referenceSet.has(v));
  if (extra.length > 0) {
    console.error(`[FAIL] ${themeId}: 多出 ${extra.length} 个变量（相对 ${referenceId}）:`);
    for (const v of extra) {
      console.error(`  - ${v}`);
    }
    hasError = true;
  }

  // 变量数量
  if (vars.length !== referenceVars.length) {
    console.error(`[FAIL] ${themeId}: 变量数量 ${vars.length}，期望 ${referenceVars.length}`);
    hasError = true;
  }
}

if (hasError) {
  console.error('\n主题完整性校验失败');
  process.exit(1);
}

// biome 禁止 console.log，用 process.stdout 输出成功信息
const themeCount = themeVarsMap.size;
const varCount = referenceVars.length;
process.stdout.write(
  `[PASS] ${themeCount} 个主题，每个主题 ${varCount} 个变量，命名规范全部通过\n`,
);
