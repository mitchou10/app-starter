import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { AuthButton } from '@/components/AuthButton'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Footer } from '@/features/landing/Footer'
import { Header } from '@/features/landing/Header'
import { NAV } from './nav'
import { ScrollToHash } from './ScrollToHash'

/** What every page shares: header, footer and the place where the page goes. */
export function RootLayout() {
  const { t } = useTranslation()

  return (
    <>
      <ScrollToHash />
      <Header brand={t('app.title')} nav={NAV.map(({ key, to }) => ({ label: t(`nav.${key}`), to }))}>
        <LanguageSwitcher />
        <AuthButton />
      </Header>
      <main>
        <Outlet />
      </main>
      <Footer>{t('footer', { year: new Date().getFullYear() })}</Footer>
    </>
  )
}
