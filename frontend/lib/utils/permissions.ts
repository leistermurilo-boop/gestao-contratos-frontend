import { type Perfil } from '@/lib/constants/perfis'

/**
 * Verifica se um perfil está na lista de perfis permitidos.
 * Retorna false se perfil for null (usuário não autenticado).
 */
export function hasPermission(perfil: Perfil | null, allowed: Perfil[]): boolean {
  if (!perfil) return false
  return allowed.includes(perfil)
}
