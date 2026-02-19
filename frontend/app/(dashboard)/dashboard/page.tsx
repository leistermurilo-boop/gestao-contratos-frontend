import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  ClipboardCheck,
  Package,
  DollarSign,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

interface ModuleCard {
  title: string
  icon: LucideIcon
  description: string
  href: string
}

const MODULE_CARDS: ModuleCard[] = [
  {
    title: 'Contratos',
    icon: FileText,
    description: 'Gestão completa de contratos ativos e arquivados.',
    href: '/dashboard/contratos',
  },
  {
    title: 'Autorizações de Fornecimento',
    icon: ClipboardCheck,
    description: 'Controle de AFs emitidas e saldos disponíveis.',
    href: '/dashboard/autorizacoes',
  },
  {
    title: 'Entregas',
    icon: Package,
    description: 'Registro e acompanhamento de entregas realizadas.',
    href: '/dashboard/entregas',
  },
  {
    title: 'Custos',
    icon: DollarSign,
    description: 'Análise de custos médios e margens de contribuição.',
    href: '/dashboard/custos',
  },
  {
    title: 'Reajustes',
    icon: TrendingUp,
    description: 'Gestão de reajustes e atualização de valores contratuais.',
    href: '/dashboard/reajustes',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bem-vindo ao Sistema de Gestão de Contratos DUO Governance.
        </p>
      </div>

      {/* Cards dos módulos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_CARDS.map((module) => {
          const Icon = module.icon
          return (
            <Card key={module.href} className="border-slate-200 bg-white transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{module.description}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Em desenvolvimento
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
