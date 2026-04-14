import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// L3 层（ui-patterns）不应包含业务词汇
const SCAN_DIR = resolve(ROOT, 'packages/ui-patterns/src');

// 排除测试文件和 stories
const EXCLUDE_PATTERNS = [/\.test\.tsx?$/, /\.stories\.tsx?$/];

// 业务词汇黑名单（出现在组件代码中说明 L3 层耦合了具体业务）
const FORBIDDEN_WORDS = ['Order', 'Customer', 'Product', 'Sku', '订单', '客户', '商品', '库存'];

// 中文技术术语白名单（包含业务词汇子串但属于技术用语，不应报错）
const CHINESE_ALLOWLIST = ['客户端'];

const FORBIDDEN_REGEX = new RegExp(FORBIDDEN_WORDS.map((w) => `\\b${w}\\b`).join('|'), 'g');

// 中文词汇不需要 \b（中文没有 word boundary），单独匹配
const CHINESE_WORDS = FORBIDDEN_WORDS.filter((w) => /[\u4e00-\u9fff]/.test(w));
const CHINESE_REGEX = CHINESE_WORDS.length > 0 ? new RegExp(CHINESE_WORDS.join('|'), 'g') : null;

// 判断是否为注释行（简化判断：行首 // 或 * 或 /*）
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

let hasError = false;

const files = readdirSync(SCAN_DIR).filter(
  (f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !EXCLUDE_PATTERNS.some((p) => p.test(f)),
);

for (const file of files) {
  const filePath = join(SCAN_DIR, file);
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // 跳过注释行
    if (isCommentLine(line)) continue;

    const matches: string[] = [];

    // 英文词汇匹配
    for (const m of line.matchAll(FORBIDDEN_REGEX)) {
      matches.push(m[0]);
    }

    // 中文词汇匹配（排除白名单中的技术术语）
    if (CHINESE_REGEX) {
      for (const m of line.matchAll(CHINESE_REGEX)) {
        // 检查命中的位置是否属于白名单中的复合词
        const idx = m.index ?? 0;
        const isAllowed = CHINESE_ALLOWLIST.some((term) => {
          const termIdx = line.indexOf(term);
          return termIdx !== -1 && idx >= termIdx && idx < termIdx + term.length;
        });
        if (!isAllowed) {
          matches.push(m[0]);
        }
      }
    }

    if (matches.length > 0) {
      console.error(`${file}:${i + 1} 发现业务词汇: ${[...new Set(matches)].join(', ')}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\nL3 层检测到业务词汇，请移至 L5 features 层。');
  process.exit(1);
} else {
  process.stdout.write('业务词汇检查通过（L3 层无业务词汇）。\n');
}
