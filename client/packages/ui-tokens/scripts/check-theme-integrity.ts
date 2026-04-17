/**
 * Token 三层完整性校验脚本
 *
 * 检查内容：
 *   1. Primitive 层（tokens/primitive.css）：必须存在，包含必需的原始 token
 *   2. Semantic 层（tokens/semantic-*.css）：每个注册的 style 都必须提供完整的
 *      54 个 semantic token（light + dark 两组 block），命名符合规范
 *   3. Component 层（tokens/component.css）：必须存在，包含各组件必需的 token
 *   4. 以 classic.light 为基准，其他 block 的 token 集合必须一致
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKEN_NAMES, TOTAL_TOKENS } from '../src/index';
import { styleRegistry } from '../src/style-registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '../src');

const NAMING_PATTERN = /^--[a-z]+(-[a-z0-9]+)+$/;
const CORE_VARIABLES = new Set<string>(Object.values(TOKEN_NAMES));

interface ParsedBlock {
  id: string;
  variables: string[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractVariables(cssContent: string): string[] {
  const vars: string[] = [];
  const regex = /^\s*(--[a-z][a-z0-9-]*)\s*:/gm;
  for (let match = regex.exec(cssContent); match !== null; match = regex.exec(cssContent)) {
    const name = match[1];
    if (name) vars.push(name);
  }
  return vars;
}

function extractBlock(cssContent: string, selector: string): string | null {
  const pattern = new RegExp(`${escapeRegex(selector)}\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = pattern.exec(cssContent);
  return match?.[1]?.trim() ?? null;
}

function filterCoreVariables(vars: string[]): string[] {
  return vars.filter((name) => CORE_VARIABLES.has(name));
}

let hasError = false;

// ===== Primitive 层校验 =====
const primitivePath = resolve(srcDir, 'tokens/primitive.css');
if (!existsSync(primitivePath)) {
  console.error(`[FAIL] 缺少 primitive 层: ${primitivePath}`);
  hasError = true;
} else {
  const primitiveContent = readFileSync(primitivePath, 'utf-8');
  const primitiveRequired = [
    // Gray 10 阶
    '--color-gray-50',
    '--color-gray-100',
    '--color-gray-200',
    '--color-gray-300',
    '--color-gray-400',
    '--color-gray-500',
    '--color-gray-600',
    '--color-gray-700',
    '--color-gray-800',
    '--color-gray-900',
    '--color-gray-950',
    // Accent 色板（至少 500/600）
    '--color-blue-500',
    '--color-blue-600',
    '--color-green-500',
    '--color-green-600',
    '--color-red-500',
    '--color-red-600',
    '--color-amber-500',
    '--color-amber-600',
    // Radius 刻度
    '--radius-none',
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
    '--radius-xl',
    '--radius-full',
    // Size 刻度
    '--size-control-h-sm',
    '--size-control-h-md',
    '--size-control-h-lg',
    // 字体栈
    '--font-sans',
    '--font-mono',
    '--font-heading',
  ];
  const primitiveMissing = primitiveRequired.filter((name) => !primitiveContent.includes(name));
  if (primitiveMissing.length > 0) {
    console.error(`[FAIL] primitive 层缺少 ${primitiveMissing.length} 个必需 token:`);
    for (const name of primitiveMissing) console.error(`  - ${name}`);
    hasError = true;
  }
}

// ===== Component 层校验 =====
const componentPath = resolve(srcDir, 'tokens/component.css');
if (!existsSync(componentPath)) {
  console.error(`[FAIL] 缺少 component 层: ${componentPath}`);
  hasError = true;
} else {
  const componentContent = readFileSync(componentPath, 'utf-8');
  const componentRequired = [
    // Button
    '--button-bg',
    '--button-fg',
    '--button-height',
    '--button-radius',
    // Input
    '--input-bg',
    '--input-border',
    '--input-height',
    '--input-radius',
    // Card
    '--card-bg',
    '--card-border',
    '--card-radius',
    '--card-shadow',
    // Table
    '--table-header-bg',
    '--table-row-bg',
    '--table-border',
    '--table-row-height',
    // Form
    '--form-field-gap',
    '--form-label-fg',
    // Sidebar
    '--sidebar-bg',
    '--sidebar-fg',
    '--sidebar-width',
    '--sidebar-item-height',
    '--sidebar-item-active-bg',
    '--sidebar-margin-left',
    // Header
    '--header-bg',
    '--header-height',
    '--header-border',
    // Chart
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
    // W1 新增 Sidebar 激活态
    '--sidebar-item-active-fg',
    '--sidebar-item-active-weight',
    '--sidebar-item-active-indicator-width',
    '--sidebar-item-active-indicator-color',
    // W1 新增 Nav Tab
    '--nav-tab-fg',
    '--nav-tab-hover-fg',
    '--nav-tab-active-fg',
    '--nav-tab-active-bg',
    '--nav-tab-active-radius',
    '--nav-tab-active-underline-width',
    '--nav-tab-active-underline-color',
    '--nav-tab-height',
    '--nav-tab-padding-x',
    '--nav-tab-gap',
    // W1 新增 Sidebar collapsed width
    '--sidebar-collapsed-width',
  ];
  const componentMissing = componentRequired.filter((name) => !componentContent.includes(name));
  if (componentMissing.length > 0) {
    console.error(`[FAIL] component 层缺少 ${componentMissing.length} 个必需 token:`);
    for (const name of componentMissing) console.error(`  - ${name}`);
    hasError = true;
  }
}

// ===== Semantic 层校验 =====
const blocks: ParsedBlock[] = [];

for (const style of styleRegistry) {
  const cssPath = resolve(srcDir, style.cssFile);
  let content = '';
  try {
    content = readFileSync(cssPath, 'utf-8');
  } catch {
    console.error(`[FAIL] 无法读取 style 文件: ${style.id} -> ${cssPath}`);
    hasError = true;
    continue;
  }

  const lightSelector = `[data-theme-style='${style.id}']`;
  const darkSelector = `[data-theme-style='${style.id}'][data-theme-color-mode='dark']`;

  const lightBlock = extractBlock(content, lightSelector);
  const darkBlock = extractBlock(content, darkSelector);

  if (!lightBlock) {
    console.error(`[FAIL] ${style.id}: 缺少 light block ${lightSelector}`);
    hasError = true;
    continue;
  }

  if (!darkBlock) {
    console.error(`[FAIL] ${style.id}: 缺少 dark block ${darkSelector}`);
    hasError = true;
    continue;
  }

  blocks.push({
    id: `${style.id}.light`,
    variables: filterCoreVariables(extractVariables(lightBlock)),
  });
  blocks.push({
    id: `${style.id}.dark`,
    variables: filterCoreVariables(extractVariables(darkBlock)),
  });

  const allVariables = extractVariables(content);
  const namingViolations = allVariables.filter((name) => !NAMING_PATTERN.test(name));
  if (namingViolations.length > 0) {
    console.error(`[FAIL] ${style.id}: 命名违规 ${namingViolations.length} 个:`);
    for (const name of namingViolations) {
      console.error(`  - ${name}`);
    }
    hasError = true;
  }
}

const referenceId = 'classic.light';
const referenceVars = blocks.find((block) => block.id === referenceId)?.variables;

if (!referenceVars) {
  console.error(`[FAIL] 基准 block "${referenceId}" 不存在或无法解析`);
  process.exit(1);
}

if (referenceVars.length !== TOTAL_TOKENS) {
  console.error(
    `[FAIL] 基准 block "${referenceId}" 包含 ${referenceVars.length} 个变量，预期 ${TOTAL_TOKENS} 个`,
  );
  hasError = true;
}

const referenceSet = new Set(referenceVars);

for (const block of blocks) {
  if (block.id === referenceId) continue;

  const currentSet = new Set(block.variables);
  const missing = referenceVars.filter((variable) => !currentSet.has(variable));
  if (missing.length > 0) {
    console.error(`[FAIL] ${block.id}: 缺少 ${missing.length} 个变量（相对 ${referenceId}）:`);
    for (const variable of missing) {
      console.error(`  - ${variable}`);
    }
    hasError = true;
  }

  const extra = block.variables.filter((variable) => !referenceSet.has(variable));
  if (extra.length > 0) {
    console.error(`[FAIL] ${block.id}: 多出 ${extra.length} 个变量（相对 ${referenceId}）:`);
    for (const variable of extra) {
      console.error(`  - ${variable}`);
    }
    hasError = true;
  }

  if (block.variables.length !== referenceVars.length) {
    console.error(
      `[FAIL] ${block.id}: 变量数量 ${block.variables.length}，期望 ${referenceVars.length}`,
    );
    hasError = true;
  }
}

if (hasError) {
  console.error('\n主题完整性校验失败');
  process.exit(1);
}

process.stdout.write(
  `[PASS] 三层 token 完整性通过：${styleRegistry.length} 个 style，${blocks.length} 个 semantic block，每个 ${referenceVars.length} 个变量；primitive + component 层必需 token 全部存在\n`,
);
