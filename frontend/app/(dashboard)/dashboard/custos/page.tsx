import { Info } from 'lucide-react'
import { ProtectedRoute } from '@/components/common/protected-route'
import { PERFIS } from '@/lib/constants/perfis'
import { CustosTable } from '@/components/tables/custos-table'

export default function CustosPage() {
  return (
    <ProtectedRoute
      allowedPerfis={[
        PERFIS.admin,
        PERFIS.juridico,
        PERFIS.financeiro,
        PERFIS.compras,
        // ⚠️ PERFIS.logistica NÃO incluído — logística nunca vê custos (RLS + UX)
      ]}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Custos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Histórico de lançamentos de custos por item de contrato.
          </p>
        </div>

        {/* Info: como registrar custo */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-sm text-blue-700">
            Para registrar um novo custo, acesse o item pelo módulo de{' '}
            <span className="font-medium">Contratos → Itens → Registrar Custo</span>.
            Cada custo é vinculado ao item específico para correta apuração de margem.
          </p>
        </div>

        {/* Tabela de custos */}
        <CustosTable />
      </div>
    </ProtectedRoute>
  )
}
