import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { UserMenu } from '@/components/UserMenu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { APP_NAV } from './appNav'

/** Brand on top, navigation in the middle, profile at the bottom. */
export function AppSidebar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/app" className="px-2 py-1.5 text-lg font-semibold">
          {t('app.title')}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {APP_NAV.map(({ key, to, icon: Icon }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton render={<Link to={to} />} isActive={pathname === to}>
                    <Icon aria-hidden />
                    {t(`appNav.${key}`)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
