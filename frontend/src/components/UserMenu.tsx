import { ChevronsUpDown, Languages, ListChecks, LogOut, MessageSquarePlus, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/auth/AuthProvider'
import { UserAvatar } from '@/components/UserAvatar'
import { ADMIN_NAV } from '@/layouts/appNav'
import { FeedbackDialog } from '@/features/feedback/components/FeedbackDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useLanguage } from '@/i18n/useLanguage'

/** The profile at the bottom of the sidebar. Click it: settings, language, sign out. */
export function UserMenu() {
  const { t } = useTranslation()
  const { user, avatarVersion, logout } = useCurrentUser()
  const { current, languages, change } = useLanguage()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  if (!user) return null

  const name = user.name || user.username || user.email

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label={t('userMenu.open')} />}>
            <UserAvatar user={user} version={avatarVersion} className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDown aria-hidden className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="min-w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
                <UserAvatar user={user} version={avatarVersion} className="size-8" />
                <div className="grid text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('userMenu.feedback')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                <MessageSquarePlus aria-hidden />
                {t('userMenu.giveFeedback')}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/feedback" />}>
                <ListChecks aria-hidden />
                {t('userMenu.myFeedback')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem render={<Link to="/settings" />}>
              <Settings aria-hidden />
              {t('userMenu.settings')}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Languages aria-hidden />
                {t('userMenu.language')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={current} onValueChange={change}>
                  {languages.map((language) => (
                    <DropdownMenuRadioItem key={language.value} value={language.value}>
                      {language.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {user.is_admin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t('userMenu.admin')}</DropdownMenuLabel>
                  {ADMIN_NAV.map(({ key, to, icon: Icon }) => (
                    <DropdownMenuItem key={key} render={<Link to={to} />}>
                      <Icon aria-hidden />
                      {t(`appNav.${key}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()}>
              <LogOut aria-hidden />
              {t('userMenu.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {/* Outside the menu: the menu unmounts its content when it closes, and the dialog must stay. */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </SidebarMenu>
  )
}
