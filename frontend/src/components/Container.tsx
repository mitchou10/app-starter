import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Centers its content and gives it a readable max width. */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-5xl px-6', className)} {...props} />
}
