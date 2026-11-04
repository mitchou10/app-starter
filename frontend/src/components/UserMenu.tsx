import { ChevronsUpDown, Languages, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/auth/AuthProvider'
import { UserAvatar } from '@/components/UserAvatar'
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
  const { user, logout } = useCurrentUser()
  const { current, languages, change } = useLanguage()
  if (!user) return null

  const name = user.name || user.username || user.email

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label={t('userMenu.open')} />}>
            <UserAvatar user={user} className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDown aria-hidden className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="min-w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
                <UserAvatar user={user} className="size-8" />
                <div className="grid text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
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

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()}>
              <LogOut aria-hidden />
              {t('userMenu.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
