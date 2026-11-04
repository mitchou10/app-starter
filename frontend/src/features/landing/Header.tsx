import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Container } from '@/components/Container'

export interface NavItem {
  label: string
  to: string
}

interface HeaderProps {
  brand: string
  nav?: NavItem[]
  /** Right side: language switcher, sign in... */
  children?: ReactNode
}

export function Header({ brand, nav = [], children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link to="/" className="text-lg font-semibold">
          {brand}
        </Link>
        <nav aria-label="Main" className="hidden gap-6 text-sm sm:flex">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">{children}</div>
      </Container>
    </header>
  )
}
