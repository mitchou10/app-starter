import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '@/i18n'

/** The language in use, the supported ones (each named in its own language) and a way to change it. */
export function useLanguage() {
  const { t, i18n } = useTranslation()
  // `resolvedLanguage` is the supported one in use (fr-FR resolves to fr).
  const current = (i18n.resolvedLanguage ?? 'en') as Language
  const languages = LANGUAGES.map((language) => ({ value: language, label: t(`language.${language}`) }))
  const change = (language: string) => void i18n.changeLanguage(language)
  return { current, languages, change }
}
