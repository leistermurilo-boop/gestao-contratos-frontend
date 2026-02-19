'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  DASHBOARD_ROUTES,
  ADMIN_ROUTES,
  canAccessRoute,
  type Route,
} from '@/lib/constants/routes'
import { useAuth } from '@/contexts/auth-context'
import { useEmpresa } from '@/contexts/empresa-context'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { usuario } = useAuth()
  const { empresa } = useEmpresa()

  const perfil = usuario?.perfil ?? ''

  const mainRoutes = DASHBOARD_ROUTES.filter((route) => canAccessRoute(route, perfil))
  const adminRoutes = ADMIN_ROUTES.filter((route) => canAccessRoute(route, perfil))

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-navy text-white transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo e empresa */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-emerald">
            <span className="text-xs font-bold text-white">DG</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">DUO Governance</p>
            {empresa && (
              <p className="mt-0.5 truncate text-xs text-white/50">{empresa.nome}</p>
            )}
          </div>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {mainRoutes.map((route) => (
              <NavItem
                key={route.href}
                route={route}
                isActive={
                  pathname === route.href ||
                  (route.href !== '/dashboard' && pathname.startsWith(route.href + '/'))
                }
                onClick={onClose}
              />
            ))}
          </div>

          {/* Seção de administração */}
          {adminRoutes.length > 0 && (
            <>
              <Separator className="my-4 bg-white/10" />
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Administração
              </p>
              <div className="space-y-0.5">
                {adminRoutes.map((route) => (
                  <NavItem
                    key={route.href}
                    route={route}
                    isActive={pathname === route.href || pathname.startsWith(route.href + '/')}
                    onClick={onClose}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Rodapé com info do usuário */}
        {usuario && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                <span className="text-xs font-medium uppercase">
                  {usuario.nome?.charAt(0) ?? 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{usuario.nome}</p>
                <p className="mt-0.5 text-xs capitalize text-white/50">{usuario.perfil}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

interface NavItemProps {
  route: Route
  isActive: boolean
  onClick: () => void
}

function NavItem({ route, isActive, onClick }: NavItemProps) {
  const Icon = route.icon

  return (
    <Link
      href={route.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-brand-emerald text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{route.label}</span>
    </Link>
  )
}
