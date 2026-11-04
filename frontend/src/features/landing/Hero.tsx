import type { ReactNode } from 'react'
import { Section } from '@/components/Section'

interface HeroProps {
  title: string
  description: string
  /** Buttons or links under the text. */
  actions?: ReactNode
}

export function Hero({ title, description, actions }: HeroProps) {
  return (
    <Section className="text-center">
      <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{description}</p>
      {actions && <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{actions}</div>}
    </Section>
  )
}
