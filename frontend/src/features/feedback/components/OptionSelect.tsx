import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface Option {
  value: string
  label: string
}

interface OptionSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  label: string
  placeholder?: string
  className?: string
}

/** A dropdown over a list of options: used by the form, the filters and the status control. */
export function OptionSelect({ value, onChange, options, label, placeholder, className }: OptionSelectProps) {
  return (
    <Select value={value} items={options} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
