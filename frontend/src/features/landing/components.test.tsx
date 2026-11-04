import { screen } from '@testing-library/react'
import { Rocket } from 'lucide-react'
import { expect, it } from 'vitest'
import { renderWithProviders as render } from '@/test/render'
import { FeatureCard } from './FeatureCard'
import { Footer } from './Footer'
import { Header } from './Header'
import { Hero } from './Hero'
import { LinkButton } from './LinkButton'

it('FeatureCard shows what it is given', () => {
  render(<FeatureCard icon={Rocket} title="Fast" description="Very fast" />)
  expect(screen.getByText('Fast')).toBeInTheDocument()
  expect(screen.getByText('Very fast')).toBeInTheDocument()
})

it('Hero shows its actions only when there are some', () => {
  const { rerender } = render(<Hero title="Hello" description="World" actions={<a href="#x">Go</a>} />)
  expect(screen.getByRole('heading', { level: 1, name: 'Hello' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument()
  rerender(<Hero title="Hello" description="World" />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

it('Header shows the brand, the navigation and its children', () => {
  render(
    <Header brand="Acme" nav={[{ label: 'Docs', to: '/docs' }]}>
      <button>Action</button>
    </Header>,
  )
  expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
  expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
})

it('Header works without navigation', () => {
  render(<Header brand="Acme" />)
  expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument()
})

it('LinkButton is a link, not a button', () => {
  render(<LinkButton to="/a" variant="outline">Go</LinkButton>)
  expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/a')
})

it('Footer shows its text', () => {
  render(<Footer>© Acme</Footer>)
  expect(screen.getByText('© Acme')).toBeInTheDocument()
})
