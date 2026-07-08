import { useState, useEffect } from 'react';
import { languageService, SupportedLanguage } from '@/services/language';
import { getTranslation } from '@/translations';
import type { TranslationKeys } from '@/translations/en';

export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    languageService.getCurrentLanguage()
  );

  useEffect(() => {
    const unsubscribe = languageService.subscribe((lang) => {
      setCurrentLang(lang);
    });

    return unsubscribe;
  }, []);

  const t = getTranslation(currentLang);

  const changeLanguage = (lang: SupportedLanguage) => {
    languageService.setLanguage(lang);
  };

  return {
    t,
    currentLang,
    changeLanguage,
  };
}
