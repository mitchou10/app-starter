import type { ComponentProps } from 'react'
import { Container } from '@/components/Container'
import { cn } from '@/lib/utils'

/** A full-width band of the page. Give it an `id` to make it a target of the navigation. */
export function Section({ className, children, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('py-16 sm:py-24', className)} {...props}>
      <Container>{children}</Container>
    </section>
  )
}
