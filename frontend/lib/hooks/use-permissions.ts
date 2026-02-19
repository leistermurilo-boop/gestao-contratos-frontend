'use client'

import { useAuth } from '@/contexts/auth-context'
import {
  canViewCosts,
  canEditContratos,
  canManageUsers,
  canEmitAF,
  canRegisterEntrega,
  PERFIS,
} from '@/lib/constants/perfis'

/**
 * Hook que expõe as permissões do usuário autenticado.
 * Retorna false para todas as permissões se não houver usuário.
 */
export function usePermissions() {
  const { usuario } = useAuth()

  if (!usuario) {
    return {
      perfil: null,
      canViewCosts: false,
      canEditContratos: false,
      canManageUsers: false,
      canEmitAF: false,
      canRegisterEntrega: false,
      isAdmin: false,
    }
  }

  return {
    perfil: usuario.perfil,
    canViewCosts: canViewCosts(usuario.perfil),
    canEditContratos: canEditContratos(usuario.perfil),
    canManageUsers: canManageUsers(usuario.perfil),
    canEmitAF: canEmitAF(usuario.perfil),
    canRegisterEntrega: canRegisterEntrega(usuario.perfil),
    isAdmin: usuario.perfil === PERFIS.admin,
  }
}
