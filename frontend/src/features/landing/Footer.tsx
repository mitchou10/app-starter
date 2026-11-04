import { Container } from '@/components/Container'

export function Footer({ children }: { children: string }) {
  return (
    <footer className="border-t py-8">
      <Container className="text-center text-sm text-muted-foreground">{children}</Container>
    </footer>
  )
}
