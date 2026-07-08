// Language Service for Multi-language Support

export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'mr' | 'bn' | 'gu' | 'ml' | 'pa' | 'or';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
];

class LanguageService {
  private currentLanguage: SupportedLanguage = 'en';
  private listeners: ((lang: SupportedLanguage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_language') as SupportedLanguage;
      if (saved && this.isSupported(saved)) {
        this.currentLanguage = saved;
      }
    }
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  setLanguage(lang: SupportedLanguage) {
    if (!this.isSupported(lang)) {
      console.warn(`Language ${lang} not supported, using English`);
      lang = 'en';
    }
    
    this.currentLanguage = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
    }
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(lang));
  }

  isSupported(lang: string): boolean {
    return SUPPORTED_LANGUAGES.some(l => l.code === lang);
  }

  getLanguageName(code: SupportedLanguage): string {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang?.nativeName || 'English';
  }

  subscribe(listener: (lang: SupportedLanguage) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const languageService = new LanguageService();
