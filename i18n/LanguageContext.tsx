import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, TranslationKeys, translations, t as translate } from './translations';
import { storage } from '@/utils/storage';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('cs');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await storage.getLanguage();
      const validLanguages = ['cs', 'en', 'de', 'fr', 'es', 'it', 'pl', 'nl', 'pt', 'sv', 'no', 'da', 'fi', 'hu', 'ro'];
      if (savedLanguage && validLanguages.includes(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await storage.setLanguage(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = useCallback((key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    return translate(key, language, params);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
