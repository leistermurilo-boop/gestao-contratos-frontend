import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContratosTable } from '@/components/tables/contratos-table'

export default function ContratosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contratos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestão completa de contratos ativos e arquivados.
          </p>
        </div>
        <Button asChild className="flex-shrink-0 bg-brand-navy hover:bg-brand-navy/90">
          <Link href="/dashboard/contratos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Link>
        </Button>
      </div>
      <ContratosTable />
    </div>
  )
}
