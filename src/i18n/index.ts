import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '../db/db';
import { ar } from './ar';
import { en } from './en';

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

export async function initI18n(language: Language = 'ar'): Promise<typeof i18n> {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'ar',
      supportedLngs: ['ar', 'en'],
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  } else {
    await i18n.changeLanguage(language);
  }
  return i18n;
}

export default i18n;
