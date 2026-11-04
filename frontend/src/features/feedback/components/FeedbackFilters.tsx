import { useTranslation } from 'react-i18next'
import { useFeedback } from '../FeedbackProvider'
import { OptionSelect } from './OptionSelect'

export interface Filters {
  status: string
  type: string
}

export const NO_FILTER: Filters = { status: 'all', type: 'all' }

export function FeedbackFilters({ value, onChange }: { value: Filters; onChange: (filters: Filters) => void }) {
  const { t } = useTranslation()
  const { statuses, types } = useFeedback()
  const all = (label: string) => ({ value: 'all', label })

  return (
    <div className="flex flex-wrap gap-2">
      <OptionSelect
        label={t('feedback.filters.status')}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
        options={[all(t('feedback.filters.allStatuses')), { value: 'open', label: t('feedback.filters.open') }, ...statuses.map((s) => ({ value: s.id, label: s.name }))]}
        className="w-48"
      />
      <OptionSelect
        label={t('feedback.filters.type')}
        value={value.type}
        onChange={(type) => onChange({ ...value, type })}
        options={[all(t('feedback.filters.allTypes')), ...types.map((type) => ({ value: type.id, label: type.name }))]}
        className="w-44"
      />
    </div>
  )
}
