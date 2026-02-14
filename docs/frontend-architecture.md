# 🎨 ESTRUTURA DO FRONTEND - Next.js 14 + TypeScript

## 📁 ARQUITETURA DO PROJETO

```
gestao-contratos-frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Grupo de rotas públicas
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/              # Grupo de rotas autenticadas
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard principal
│   │   ├── contratos/
│   │   │   ├── page.tsx          # Lista de contratos
│   │   │   ├── novo/
│   │   │   │   └── page.tsx      # Criar contrato
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detalhes do contrato
│   │   │       ├── editar/
│   │   │       │   └── page.tsx
│   │   │       └── itens/
│   │   │           └── page.tsx  # Itens do contrato
│   │   ├── custos/
│   │   │   ├── page.tsx          # Lista de custos
│   │   │   └── novo/
│   │   │       └── page.tsx
│   │   ├── autorizacoes/
│   │   │   ├── page.tsx          # Lista de AFs
│   │   │   └── novo/
│   │   │       └── page.tsx
│   │   ├── entregas/
│   │   │   ├── page.tsx
│   │   │   └── novo/
│   │   │       └── page.tsx
│   │   ├── empresas/
│   │   │   ├── page.tsx          # Gestão de empresas (admin)
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── usuarios/
│   │   │   ├── page.tsx          # Gestão de usuários
│   │   │   └── novo/
│   │   │       └── page.tsx
│   │   ├── cnpjs/
│   │   │   ├── page.tsx
│   │   │   └── novo/
│   │   │       └── page.tsx
│   │   └── layout.tsx            # Layout com sidebar
│   │
│   ├── api/                      # API Routes (se necessário)
│   │   └── upload/
│   │       └── route.ts
│   │
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Componentes de layout
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── breadcrumb.tsx
│   │
│   ├── forms/                    # Formulários específicos
│   │   ├── contrato-form.tsx
│   │   ├── item-contrato-form.tsx
│   │   ├── custo-form.tsx
│   │   ├── af-form.tsx
│   │   ├── entrega-form.tsx
│   │   └── usuario-form.tsx
│   │
│   ├── tables/                   # Tabelas de dados
│   │   ├── contratos-table.tsx
│   │   ├── itens-table.tsx
│   │   ├── custos-table.tsx
│   │   └── data-table.tsx        # Componente genérico
│   │
│   ├── charts/                   # Gráficos e visualizações
│   │   ├── margem-chart.tsx
│   │   ├── custos-evolution-chart.tsx
│   │   └── dashboard-cards.tsx
│   │
│   ├── modals/                   # Modais
│   │   ├── confirm-dialog.tsx
│   │   ├── upload-modal.tsx
│   │   └── details-modal.tsx
│   │
│   └── common/                   # Componentes comuns
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       ├── file-upload.tsx
│       └── status-badge.tsx
│
├── lib/                          # Bibliotecas e utilitários
│   ├── supabase/
│   │   ├── client.ts             # Cliente Supabase (browser)
│   │   ├── server.ts             # Cliente Supabase (server)
│   │   └── middleware.ts         # Middleware auth
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── use-contratos.ts
│   │   ├── use-itens.ts
│   │   ├── use-custos.ts
│   │   ├── use-user.ts
│   │   └── use-empresa.ts
│   │
│   ├── services/                 # Camada de serviços
│   │   ├── contratos.service.ts
│   │   ├── itens.service.ts
│   │   ├── custos.service.ts
│   │   ├── af.service.ts
│   │   ├── entregas.service.ts
│   │   └── upload.service.ts
│   │
│   ├── validations/              # Schemas Zod
│   │   ├── contrato.schema.ts
│   │   ├── item.schema.ts
│   │   ├── custo.schema.ts
│   │   └── usuario.schema.ts
│   │
│   ├── utils/                    # Funções utilitárias
│   │   ├── formatters.ts         # Formatação de dados
│   │   ├── validators.ts         # Validadores
│   │   ├── calculations.ts       # Cálculos (margem, etc)
│   │   └── date-utils.ts
│   │
│   └── constants/                # Constantes
│       ├── status.ts
│       ├── perfis.ts
│       └── routes.ts
│
├── types/                        # TypeScript types
│   ├── database.types.ts         # Gerado pelo Supabase
│   ├── models.ts                 # Modelos de domínio
│   └── api.types.ts
│
├── contexts/                     # React Contexts
│   ├── auth-context.tsx
│   ├── empresa-context.tsx
│   └── theme-context.tsx
│
├── middleware.ts                 # Next.js middleware
├── .env.local                    # Variáveis de ambiente
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎯 STACK TECNOLÓGICA

### **Core**
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ React 18

### **Styling**
- ✅ Tailwind CSS
- ✅ shadcn/ui (componentes)
- ✅ Radix UI (primitivos)
- ✅ Lucide Icons

### **Backend/Database**
- ✅ Supabase (Auth + Database + Storage)
- ✅ PostgreSQL

### **Forms & Validation**
- ✅ React Hook Form
- ✅ Zod

### **Charts & Visualization**
- ✅ Recharts

### **Utilities**
- ✅ date-fns (manipulação de datas)
- ✅ clsx + tailwind-merge
- ✅ react-hot-toast (notificações)

---

## 🔐 AUTENTICAÇÃO & AUTORIZAÇÃO

### **Flow de Autenticação**
```typescript
// lib/supabase/client.ts
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session && !isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return response
}
```

### **Controle de Permissões por Perfil**
```typescript
// lib/utils/permissions.ts
type Perfil = 'admin' | 'juridico' | 'financeiro' | 'compras' | 'logistica'

const PERMISSIONS = {
  admin: ['*'], // Acesso total
  juridico: ['contratos.read', 'contratos.write', 'reajustes.*'],
  financeiro: ['contratos.read', 'custos.*', 'margem.read'],
  compras: ['contratos.read', 'custos.*', 'af.*'],
  logistica: ['af.read', 'entregas.*']
}

export function canUser(perfil: Perfil, action: string): boolean {
  const permissions = PERMISSIONS[perfil]
  return permissions.includes('*') || permissions.includes(action)
}
```

---

## 📊 COMPONENTES PRINCIPAIS

### **1. Dashboard**
```typescript
// app/(dashboard)/dashboard/page.tsx
export default async function DashboardPage() {
  const { data: metricas } = await getMetricas()
  
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Contratos Ativos"
          value={metricas.totalContratos}
          icon={FileText}
        />
        <MetricCard
          title="Valor Total"
          value={formatCurrency(metricas.valorTotal)}
          icon={DollarSign}
        />
        <MetricCard
          title="Margem Média"
          value={`${metricas.margemMedia}%`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Alertas"
          value={metricas.totalAlertas}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MargemEvolutionChart data={metricas.margemHistorico} />
        <ContratosVencimentoChart data={metricas.proximosVencimentos} />
      </div>
      
      {/* Alertas e Notificações */}
      <AlertsSection alerts={metricas.alertas} />
    </div>
  )
}
```

### **2. Formulário de Contrato**
```typescript
// components/forms/contrato-form.tsx
const contratoSchema = z.object({
  numero_contrato: z.string().min(1),
  orgao_publico: z.string().min(1),
  cnpj_id: z.string().uuid(),
  objeto: z.string(),
  valor_total: z.number().positive(),
  data_assinatura: z.date(),
  data_vigencia_inicio: z.date(),
  data_vigencia_fim: z.date(),
  esfera: z.enum(['municipal', 'estadual', 'federal'])
})

export function ContratoForm({ contratoId }: { contratoId?: string }) {
  const form = useForm<z.infer<typeof contratoSchema>>({
    resolver: zodResolver(contratoSchema)
  })
  
  const onSubmit = async (data: z.infer<typeof contratoSchema>) => {
    if (contratoId) {
      await updateContrato(contratoId, data)
    } else {
      await createContrato(data)
    }
    toast.success('Contrato salvo com sucesso!')
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos do formulário */}
      </form>
    </Form>
  )
}
```

### **3. Tabela de Dados Genérica**
```typescript
// components/tables/data-table.tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  filters?: FilterOption[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filters
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  
  // TanStack Table implementation
  
  return (
    <div>
      <div className="flex items-center justify-between">
        <Input
          placeholder={`Buscar...`}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn(searchKey)?.setFilterValue(e.target.value)
          }
        />
        <DropdownMenu>
          {/* Filtros */}
        </DropdownMenu>
      </div>
      <Table>
        {/* Renderização da tabela */}
      </Table>
    </div>
  )
}
```

### **4. Upload de Arquivos**
```typescript
// components/common/file-upload.tsx
export function FileUpload({
  bucket,
  path,
  onUploadComplete
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  
  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`${path}/${file.name}`, file)
      
      if (error) throw error
      
      const url = supabase.storage.from(bucket).getPublicUrl(data.path)
      onUploadComplete(url.data.publicUrl)
      toast.success('Arquivo enviado!')
    } catch (error) {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
    </div>
  )
}
```

---

## 🔄 SERVIÇOS (SERVICES LAYER)

### **Exemplo: Contratos Service**
```typescript
// lib/services/contratos.service.ts
import { createClient } from '@/lib/supabase/client'
import type { Contrato, CreateContratoDTO } from '@/types/models'

export class ContratosService {
  private supabase = createClient()
  
  async getAll() {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        cnpj:cnpjs(*),
        empresa:empresas(*),
        itens:itens_contrato(count)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Contrato[]
  }
  
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        cnpj:cnpjs(*),
        empresa:empresas(*),
        itens:itens_contrato(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    if (error) throw error
    return data as Contrato
  }
  
  async create(dto: CreateContratoDTO) {
    const { data, error } = await this.supabase
      .from('contratos')
      .insert(dto)
      .select()
      .single()
    
    if (error) throw error
    return data as Contrato
  }
  
  async update(id: string, dto: Partial<CreateContratoDTO>) {
    const { data, error } = await this.supabase
      .from('contratos')
      .update(dto)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Contrato
  }
  
  async softDelete(id: string) {
    const { error } = await this.supabase
      .from('contratos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

export const contratosService = new ContratosService()
```

---

## 🎨 FEATURES ESSENCIAIS

### **Módulos a Implementar:**
1. ✅ Autenticação (Login, Register, Password Reset)
2. ✅ Dashboard (Métricas, Gráficos, Alertas)
3. ✅ Contratos (CRUD completo)
4. ✅ Itens de Contrato (CRUD + visualização de margem)
5. ✅ Custos (CRUD + upload de NF)
6. ✅ Autorizações de Fornecimento (emissão, acompanhamento)
7. ✅ Entregas (registro + upload de NF)
8. ✅ Empresas (gestão para admin)
9. ✅ CNPJs (CRUD)
10. ✅ Usuários (gestão de permissões)

### **Features Especiais:**
- ✅ Upload de arquivos (contratos, NFs, AFs)
- ✅ Filtros avançados em tabelas
- ✅ Exportação de dados (CSV, Excel)
- ✅ Visualização de margem em tempo real
- ✅ Alertas visuais (margem baixa, vencimento próximo)
- ✅ Realtime updates (Supabase subscriptions)
- ✅ Modo dark/light
- ✅ Responsive design

---

## 🚀 SETUP INICIAL

```bash
# Criar projeto Next.js
npx create-next-app@latest gestao-contratos --typescript --tailwind --app

# Instalar dependências
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install react-hook-form @hookform/resolvers zod
npm install date-fns recharts
npm install lucide-react
npm install clsx tailwind-merge
npm install react-hot-toast

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table dialog select badge alert
```

---

## 📝 VARIÁVEIS DE AMBIENTE

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

Este é o blueprint completo do frontend. Aguardando os scripts SQL para começar! 🚀
