
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import fr from '@/locales/fr.json';

type Translations = { [key: string]: any };

const translations: { [key: string]: Translations } = { en, es, pt, fr };

type TranslationContextType = {
  locale: string | null;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
};

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<string | null>(null);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && Object.keys(translations).includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (Object.keys(translations).includes(browserLang)) {
        setLocaleState(browserLang);
      } else {
        setLocaleState('pt'); // Default to Portuguese
      }
    }
  }, []);

  const setLocale = (newLocale: string) => {
    if (Object.keys(translations).includes(newLocale)) {
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = useCallback((key: string): string => {
    const currentLocale = locale || 'pt';
    const keys = key.split('.');
    let result = translations[currentLocale];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Fallback to English if key not found in current locale
        result = translations['en'];
        for (const fk of keys) {
            if (result && typeof result === 'object' && fk in result) {
                result = result[fk];
            } else {
                return key; // Return the key itself if not found in fallback
            }
        }
        break;
      }
    }
    return typeof result === 'string' ? result : key;
  }, [locale]);

  if (!locale) {
    return null;
  }

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
};
