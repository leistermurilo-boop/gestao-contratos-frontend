'use client'

import { Menu, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { useEmpresa } from '@/contexts/empresa-context'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { usuario, signOut } = useAuth()
  const { empresa } = useEmpresa()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Botão menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Nome da empresa (mobile) */}
      <div className="min-w-0 flex-1 lg:hidden">
        {empresa && (
          <p className="truncate text-sm font-medium text-slate-600">{empresa.nome}</p>
        )}
      </div>

      {/* Spacer desktop */}
      <div className="hidden flex-1 lg:block" />

      {/* Ações do lado direito */}
      <div className="flex items-center gap-1">
        {/* Notificações (placeholder) */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificações"
          className="text-slate-500 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* Menu do usuário */}
        {usuario && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                  {usuario.nome?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-medium leading-tight text-slate-900">
                    {usuario.nome}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{usuario.perfil}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-none">{usuario.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">{usuario.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
