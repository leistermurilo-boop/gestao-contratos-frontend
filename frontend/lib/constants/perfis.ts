export const PERFIS = {
  admin: 'admin',
  juridico: 'juridico',
  financeiro: 'financeiro',
  compras: 'compras',
  logistica: 'logistica',
} as const

export type Perfil = (typeof PERFIS)[keyof typeof PERFIS]

/**
 * Mapeamento de permissões por perfil.
 * ATENÇÃO: Permissões no frontend são UX-level.
 * A segurança real é garantida pelo RLS no banco (Decisão #7).
 *
 * '*' = acesso total (apenas admin)
 */
export const PERMISSIONS: Record<Perfil, string[]> = {
  [PERFIS.admin]: ['*'],
  [PERFIS.juridico]: ['contratos.*', 'reajustes.*'],
  [PERFIS.financeiro]: ['contratos.read', 'custos.*', 'margem.read'],
  [PERFIS.compras]: ['contratos.read', 'custos.*', 'af.*'],
  // ⚠️ CRÍTICO: logística NÃO tem acesso a custos ou margens
  [PERFIS.logistica]: ['af.read', 'entregas.*'],
}

/** Verifica se um perfil tem uma permissão específica */
export function canUser(perfil: Perfil, action: string): boolean {
  const permissions = PERMISSIONS[perfil]
  return permissions.includes('*') || permissions.includes(action)
}

/** Logística NÃO vê custos — verificação direta e explícita */
export function canViewCosts(perfil: Perfil): boolean {
  return perfil !== PERFIS.logistica
}

/** Apenas admin e jurídico podem editar contratos */
export function canEditContratos(perfil: Perfil): boolean {
  return perfil === PERFIS.admin || perfil === PERFIS.juridico
}

/** Apenas admin gerencia usuários */
export function canManageUsers(perfil: Perfil): boolean {
  return perfil === PERFIS.admin
}

/** Admin e compras podem emitir AF */
export function canEmitAF(perfil: Perfil): boolean {
  return perfil === PERFIS.admin || perfil === PERFIS.compras
}

/** Todos exceto financeiro podem registrar entregas */
export function canRegisterEntrega(perfil: Perfil): boolean {
  return perfil !== PERFIS.financeiro
}
