/**
 * style 完整性校验脚本
 * 检查所有 style CSS block 是否包含完全一致的核心变量集合，
 * 并验证变量命名符合 flat naming 规范。
 */
import { readFileSync } from 'node:fs';
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

const blocks: ParsedBlock[] = [];
let hasError = false;

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

  const lightSelector = `[data-style='${style.id}']`;
  const darkSelector = `[data-style='${style.id}'][data-mode='dark']`;

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
  `[PASS] ${styleRegistry.length} 个 style，${blocks.length} 个 style block，每个 block ${referenceVars.length} 个变量，命名规范全部通过\n`,
);
