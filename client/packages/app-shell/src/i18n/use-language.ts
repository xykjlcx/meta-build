import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';

export function useLanguage() {
  const { i18n } = useTranslation();
  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (!(lang in SUPPORTED_LANGUAGES)) return;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      await i18n.changeLanguage(lang);
    },
    [i18n],
  );

  return {
    language: i18n.language as SupportedLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
