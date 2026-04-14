import { themeRegistry, type ThemeId } from './theme-registry';

const STORAGE_KEY = 'mb-theme';
const validThemeIds = new Set<string>(themeRegistry.map((t) => t.id));

export function applyTheme(themeId: ThemeId): void {
  document.documentElement.dataset.theme = themeId;
  try {
    window.localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // localStorage 不可用（隐私模式 / SSR），忽略
  }
}

export function loadTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'default';
}

export function isValidTheme(value: string): value is ThemeId {
  return validThemeIds.has(value);
}

export function initTheme(): void {
  applyTheme(loadTheme());
}
