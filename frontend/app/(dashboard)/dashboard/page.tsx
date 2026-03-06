import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  ClipboardCheck,
  Package,
  DollarSign,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { DashboardCards } from '@/components/charts/dashboard-cards'
import { DashboardAlertas } from '@/components/charts/dashboard-alertas'
import { IndiceWidgetWrapper } from '@/components/maturidade/indice-widget-wrapper'

// ssr: false — recharts usa useLayoutEffect e browser APIs (ResizeObserver).
// Sem isso, o SSR do Node.js falha silenciosamente → RSC payload malformado
// → hydration bail-out → spinner infinito em produção.
const MargemChart = dynamic(
  () => import('@/components/charts/margem-chart').then((m) => ({ default: m.MargemChart })),
  { ssr: false }
)
const VencimentosChart = dynamic(
  () => import('@/components/charts/vencimentos-chart').then((m) => ({ default: m.VencimentosChart })),
  { ssr: false }
)

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

      {/* Métricas em tempo real */}
      <DashboardCards />

      {/* Gráficos analíticos */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">
          Análise
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Evolução de Margem (3 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MargemChart />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Vencimentos Próximos (90 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VencimentosChart />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas operacionais */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">
          Alertas
        </h2>
        <DashboardAlertas />
      </div>

      {/* Índice de Maturidade DUO™ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <IndiceWidgetWrapper />
        </div>
      </div>

      {/* Cards dos módulos */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">
          Módulos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_CARDS.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href} className="block">
                <Card className="h-full border-slate-200 bg-white transition-shadow hover:shadow-md">
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
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-navy">
                      Acessar módulo <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
