import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Shield,
  type LucideIcon,
} from 'lucide-react'

export interface Route {
  label: string
  href: string
  icon: LucideIcon
  perfis_permitidos: string[]
}

// Todos os perfis podem acessar
const PERFIS_TODOS: string[] = ['admin', 'juridico', 'financeiro', 'compras', 'logistica']

// CRÍTICO: logística NÃO vê custos (Decisão #7 - filtro é UX, RLS garante segurança real)
const PERFIS_SEM_LOGISTICA: string[] = ['admin', 'juridico', 'financeiro', 'compras']

// Apenas admin
const PERFIS_ADMIN: string[] = ['admin']

export const DASHBOARD_ROUTES: Route[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    perfis_permitidos: PERFIS_TODOS,
  },
  {
    label: 'Contratos',
    href: '/dashboard/contratos',
    icon: FileText,
    perfis_permitidos: PERFIS_TODOS,
  },
  {
    label: 'Autorizações de Fornecimento',
    href: '/dashboard/autorizacoes',
    icon: ClipboardCheck,
    perfis_permitidos: PERFIS_TODOS,
  },
  {
    label: 'Entregas',
    href: '/dashboard/entregas',
    icon: Package,
    perfis_permitidos: PERFIS_TODOS,
  },
  {
    // CRÍTICO: logística NÃO vê custos nem margens
    label: 'Custos',
    href: '/dashboard/custos',
    icon: DollarSign,
    perfis_permitidos: PERFIS_SEM_LOGISTICA,
  },
  {
    // CRÍTICO: logística NÃO vê reajustes (contém dados de custo)
    label: 'Reajustes',
    href: '/dashboard/reajustes',
    icon: TrendingUp,
    perfis_permitidos: PERFIS_SEM_LOGISTICA,
  },
]

export const ADMIN_ROUTES: Route[] = [
  {
    label: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    perfis_permitidos: PERFIS_ADMIN,
  },
  {
    label: 'Empresas',
    href: '/dashboard/empresas',
    icon: Building2,
    perfis_permitidos: PERFIS_ADMIN,
  },
  {
    label: 'Auditoria',
    href: '/dashboard/auditoria',
    icon: Shield,
    perfis_permitidos: PERFIS_ADMIN,
  },
]

/**
 * Verifica se um perfil tem acesso a uma rota.
 * Esta função é UX-level — a segurança real é garantida pelo RLS no banco.
 */
export function canAccessRoute(route: Route, perfil: string): boolean {
  return route.perfis_permitidos.includes(perfil)
}
