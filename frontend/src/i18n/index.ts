import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

export const LANGUAGES = ['en', 'fr'] as const
export type Language = (typeof LANGUAGES)[number]

void i18n
  .use(LanguageDetector) // saved choice first, then the browser's language
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    supportedLngs: LANGUAGES,
    // fr-FR -> fr
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes
    detection: { caches: ['localStorage'] },
  })

export default i18n
