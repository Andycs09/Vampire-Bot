import { en } from './en';
import type { TranslationKeys } from './en';
import { hi } from './hi';
import { kn } from './kn';
import { gu } from './gu';
import { bn } from './bn';
import { ml } from './ml';
import { mr } from './mr';
import { ta } from './ta';
import { te } from './te';
import { pa } from './pa';
import { or } from './or';
import type { SupportedLanguage } from '@/services/language';

export const translations: Record<SupportedLanguage, Partial<TranslationKeys>> = {
  en,
  hi,
  kn,
  te,
  ta,
  mr,
  bn,
  gu,
  ml,
  pa,
  or,
};

export function getTranslation(lang: SupportedLanguage): TranslationKeys {
  return {
    ...en,
    ...(translations[lang] || {}),
  };
}
