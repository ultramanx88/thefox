'use client';

import React, { useState, useEffect } from 'react';
import { I18nManager, SUPPORTED_LOCALES, SupportedLocale } from '@repo/ui/i18n';

interface LanguageSwitcherProps {
  onLanguageChange?: (locale: SupportedLocale) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ onLanguageChange }) => {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('th');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    I18nManager.init();
    setCurrentLocale(I18nManager.getCurrentLocale());
  }, []);

  const handleLanguageChange = (locale: SupportedLocale) => {
    I18nManager.setLocale(locale);
    setCurrentLocale(locale);
    setIsOpen(false);
    onLanguageChange?.(locale);
    
    // Reload page to apply language changes
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const currentLanguage = SUPPORTED_LOCALES.find(l => l.code === currentLocale);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span>{currentLanguage?.nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {SUPPORTED_LOCALES.map((locale) => (
                <button
                  key={locale.code}
                  onClick={() => handleLanguageChange(locale.code)}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                    currentLocale === locale.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{locale.flag}</span>
                  <div>
                    <div className="font-medium">{locale.nativeName}</div>
                    <div className="text-xs text-gray-500">{locale.name}</div>
                  </div>
                  {currentLocale === locale.code && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Hook for using translations
export const useTranslation = () => {
  const [locale, setLocale] = useState<SupportedLocale>('th');

  useEffect(() => {
    I18nManager.init();
    setLocale(I18nManager.getCurrentLocale());
  }, []);

  const t = (key: string, params?: Record<string, string | number>) => {
    return I18nManager.t(key, params);
  };

  const formatCurrency = (amount: number) => {
    return I18nManager.formatCurrency(amount);
  };

  const formatDate = (date: Date) => {
    return I18nManager.formatDate(date);
  };

  return {
    t,
    locale,
    formatCurrency,
    formatDate,
    setLocale: (newLocale: SupportedLocale) => {
      I18nManager.setLocale(newLocale);
      setLocale(newLocale);
    }
  };
};