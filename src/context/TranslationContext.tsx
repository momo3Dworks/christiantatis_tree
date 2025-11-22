
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
  t: (key: string, options?: { [key: string]: string | number }) => string;
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

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const currentLocale = locale || 'pt';
    const keys = key.split('.');
    
    const findTranslation = (localeToTry: string): string | null => {
        let result = translations[localeToTry];
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return null;
            }
        }
        return typeof result === 'string' ? result : null;
    };
    
    let translationString = findTranslation(currentLocale);

    if (translationString === null) {
        translationString = findTranslation('en'); // Fallback to English
    }

    if (translationString === null) {
        return key; // Return the key itself if not found
    }

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translationString = (translationString as string).replace(regex, String(options[optionKey]));
      });
    }

    return translationString;
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
