import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LANGUAGES } from '@/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  // `resolvedLanguage` is the supported one in use (fr-FR resolves to fr).
  const items = LANGUAGES.map((language) => ({ value: language, label: t(`language.${language}`) }))

  return (
    <Select
      value={i18n.resolvedLanguage}
      items={items}
      onValueChange={(language) => language && void i18n.changeLanguage(language)}
    >
      <SelectTrigger size="sm" aria-label={t('language.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
