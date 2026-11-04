import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Responsive grid: 1 column on mobile, 2 then 3 as the screen grows. */
export function FeatureGrid({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)} {...props} />
}
