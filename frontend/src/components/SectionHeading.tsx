import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  title: string
  description?: string
  className?: string
}

export function SectionHeading({ title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn('mx-auto mb-12 max-w-2xl text-center', className)}>
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </div>
  )
}
