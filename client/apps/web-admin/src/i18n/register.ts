import { type SupportedLanguage, registerResource } from '@mb/app-shell';

export function registerBusinessResources(): void {
  const zhCNModules = import.meta.glob<{ default: Record<string, unknown> }>('./zh-CN/*.json', {
    eager: true,
  });
  const enUSModules = import.meta.glob<{ default: Record<string, unknown> }>('./en-US/*.json', {
    eager: true,
  });
  registerLanguage('zh-CN', zhCNModules);
  registerLanguage('en-US', enUSModules);
}

function registerLanguage(
  language: SupportedLanguage,
  modules: Record<string, { default: Record<string, unknown> }>,
): void {
  for (const [filePath, mod] of Object.entries(modules)) {
    const namespace = filePath.replace(/^\.\/[a-zA-Z-]+\//, '').replace(/\.json$/, '');
    registerResource(language, namespace, mod.default);
  }
}
