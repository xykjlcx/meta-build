import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';
import zhCNShell from './zh-CN/shell.json';
import zhCNCommon from './zh-CN/common.json';
import enUSShell from './en-US/shell.json';
import enUSCommon from './en-US/common.json';

function resolveInitialLanguage(): SupportedLanguage {
  if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && saved in SUPPORTED_LANGUAGES) return saved as SupportedLanguage;
  return DEFAULT_LANGUAGE;
}

export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: ['shell', 'common'],
  resources: {
    'zh-CN': { shell: zhCNShell, common: zhCNCommon },
    'en-US': { shell: enUSShell, common: enUSCommon },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function registerResource(language: SupportedLanguage, namespace: string, data: Record<string, unknown>): void {
  i18n.addResourceBundle(language, namespace, data, true, true);
}
