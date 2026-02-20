import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/common/page-header'
import { ContratoForm } from '@/components/forms/contrato-form'

export default function NovoContratoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Contrato"
        description="Preencha os dados para cadastrar um novo contrato."
      />
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Dados do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ContratoForm />
        </CardContent>
      </Card>
    </div>
  )
}
