'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/services/language';
import { useTranslation } from '@/hooks/useTranslation';

export function LanguageSelector() {
  const { currentLang, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              changeLanguage(lang.code);
              setIsOpen(false);
            }}
            className={`flex items-center gap-3 ${
              currentLang === lang.code ? 'bg-green-50 font-semibold' : ''
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex flex-col">
              <span>{lang.nativeName}</span>
              {lang.code !== 'en' && (
                <span className="text-xs text-gray-500">{lang.name}</span>
              )}
            </div>
            {currentLang === lang.code && (
              <span className="ml-auto text-green-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
