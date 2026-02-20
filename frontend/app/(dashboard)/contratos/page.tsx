import { PageHeader } from '@/components/common/page-header'
import { ContratosTable } from '@/components/tables/contratos-table'

export default function ContratosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Gestão completa de contratos ativos e arquivados."
      />
      <ContratosTable />
    </div>
  )
}
