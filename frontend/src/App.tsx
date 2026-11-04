import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function App() {
  const { t } = useTranslation()
  const { user, loaded, login, logout } = useCurrentUser()

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('app.title')}</h1>
        <LanguageSwitcher />
      </header>

      {!loaded ? (
        <p className="text-muted-foreground">{t('auth.loading')}</p>
      ) : user ? (
        <div className="flex items-center gap-4">
          <p>{t('auth.signedInAs', { name: user.name || user.username || user.email })}</p>
          <Button variant="outline" onClick={() => void logout()}>
            {t('auth.signOut')}
          </Button>
        </div>
      ) : (
        <div>
          <Button onClick={() => login()}>{t('auth.signIn')}</Button>
        </div>
      )}
    </main>
  )
}
