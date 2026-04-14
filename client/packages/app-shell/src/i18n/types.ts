export const SUPPORTED_LANGUAGES = {
  'zh-CN': { label: '简体中文' },
  'en-US': { label: 'English' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const LANGUAGE_STORAGE_KEY = 'mb_i18n_lng';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN';
