import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { FeedbackLauncher } from '@/features/feedback/components/FeedbackLauncher'
import { FeedbackProvider } from '@/features/feedback/FeedbackProvider'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'

/** The logged-in app: a sidebar on the left (a drawer on mobile) and the page next to it. */
export function AppLayout() {
  const { t } = useTranslation()

  return (
    <FeedbackProvider>
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <FeedbackLauncher />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger aria-label={t('appNav.toggle')} />
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
    </FeedbackProvider>
  )
}
