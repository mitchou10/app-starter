import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { FeedbackLauncher } from '@/features/feedback/components/FeedbackLauncher'
import { FeedbackDialogProvider } from '@/features/feedback/FeedbackDialogProvider'
import { useUnreadCount } from '@/features/notifications/api/notifications'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'

/** The logged-in app: a sidebar on the left (a drawer on mobile) and the page next to it. */
export function AppLayout() {
  const { t } = useTranslation()
  const unread = useUnreadCount()

  return (
    <FeedbackDialogProvider>
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <FeedbackLauncher />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 px-4">
            <div className="relative">
              <SidebarTrigger aria-label={t('appNav.toggle')} />
              {unread > 0 && <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-destructive ring-2 ring-background md:hidden" />}
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
    </FeedbackDialogProvider>
  )
}
