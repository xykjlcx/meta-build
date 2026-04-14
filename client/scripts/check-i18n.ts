import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const I18N_DIRS = [
  resolve(ROOT, 'packages/app-shell/src/i18n'),
  resolve(ROOT, 'apps/web-admin/src/i18n'),
];

const LANGUAGES = ['zh-CN', 'en-US'] as const;

// 递归提取 nested JSON 的 flat key 路径
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flattenKeys(v as Record<string, unknown>, key)
      : [key];
  });
}

// 收集某个目录下某个语言的所有 namespace 及其 key
function collectNamespaceKeys(dir: string, language: string): Map<string, Set<string>> {
  const langDir = join(dir, language);
  if (!existsSync(langDir)) return new Map();

  const result = new Map<string, Set<string>>();
  for (const file of readdirSync(langDir)) {
    if (!file.endsWith('.json')) continue;
    const namespace = file.replace(/\.json$/, '');
    const content = JSON.parse(readFileSync(join(langDir, file), 'utf-8'));
    result.set(namespace, new Set(flattenKeys(content)));
  }
  return result;
}

let hasError = false;

for (const dir of I18N_DIRS) {
  if (!existsSync(dir)) continue;

  // 收集每种语言的 namespace→keys 映射
  const langMaps = LANGUAGES.map((lang) => [lang, collectNamespaceKeys(dir, lang)] as const);

  // 收集所有出现过的 namespace
  const allNamespaces = new Set<string>();
  for (const [, map] of langMaps) {
    for (const ns of map.keys()) allNamespaces.add(ns);
  }

  // 对比每个 namespace 在不同语言之间的 key 差异
  for (const ns of allNamespaces) {
    const keysByLang = langMaps.map(
      ([lang, map]) => [lang, map.get(ns) ?? new Set<string>()] as const,
    );

    for (let i = 0; i < keysByLang.length; i++) {
      for (let j = i + 1; j < keysByLang.length; j++) {
        const entryI = keysByLang[i];
        const entryJ = keysByLang[j];
        if (!entryI || !entryJ) continue;
        const [langA, keysA] = entryI;
        const [langB, keysB] = entryJ;

        const missingInB = [...keysA].filter((k) => !keysB.has(k));
        const missingInA = [...keysB].filter((k) => !keysA.has(k));

        if (missingInB.length > 0) {
          console.error(
            `[${dir}] ${ns}: ${langA} 有但 ${langB} 缺少的 key:\n  ${missingInB.join('\n  ')}`,
          );
          hasError = true;
        }
        if (missingInA.length > 0) {
          console.error(
            `[${dir}] ${ns}: ${langB} 有但 ${langA} 缺少的 key:\n  ${missingInA.join('\n  ')}`,
          );
          hasError = true;
        }
      }
    }
  }
}

if (hasError) {
  console.error('\ni18n key 不一致，请修复后重试。');
  process.exit(1);
} else {
  process.stdout.write('i18n key 完整性检查通过。\n');
}
