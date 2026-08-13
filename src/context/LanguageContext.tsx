import { useMemo, useState, type ReactNode } from 'react';
import { LanguageContext, type Language, type LanguageContextValue } from './language-context-value';

const STORAGE_KEY = 'autoyard-language';

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ko';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      toggleLanguage: () =>
        setLanguage((current) => {
          const next = current === 'ko' ? 'en' : 'ko';
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        }),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
