import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_FILE = join(ROOT, '.env.example');

// 递归收集所有 .ts/.tsx 文件
function collectFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, ext));
    } else if (ext.some((e) => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

// 扫描代码中的 import.meta.env.VITE_* 用法
const usedVars = new Set<string>();
const codeFiles = collectFiles(join(ROOT, 'apps'), ['.ts', '.tsx']);
const envRegex = /import\.meta\.env\.(VITE_[A-Z_]+)/g;

for (const file of codeFiles) {
  const content = readFileSync(file, 'utf-8');
  for (const match of content.matchAll(envRegex)) {
    usedVars.add(match[1]);
  }
}

// 读取 .env.example 中声明的变量
const declaredVars = new Set<string>();
const envContent = readFileSync(ENV_FILE, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const key = trimmed.split('=')[0];
    declaredVars.add(key);
  }
}

// 检查未声明的变量
let hasError = false;
for (const v of usedVars) {
  if (!declaredVars.has(v)) {
    console.error(`❌ ${v} 在代码中使用但未在 .env.example 中声明`);
    hasError = true;
  }
}

// 警告未使用的变量
for (const v of declaredVars) {
  if (!usedVars.has(v)) {
    console.warn(`⚠ ${v} 在 .env.example 中声明但代码中未使用`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  // 检查通过，正常退出（exit code 0）
}
