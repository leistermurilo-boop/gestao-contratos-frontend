# 📐 Decisões Arquiteturais - Sistema de Gestão de Contratos

Este documento registra decisões arquiteturais imutáveis do projeto. Toda implementação DEVE seguir estas regras.

---

## 🔒 1. Multi-Tenant via RLS (Row Level Security)

### Decisão:
Isolamento de dados entre empresas é 100% controlado pelo banco via RLS.

### Regra Imutável:
- ✅ **Frontend NÃO deve filtrar por empresa_id**
- ✅ **Queries devem ser "puras" (sem .eq('empresa_id', ...))**
- ✅ **RLS filtra automaticamente baseado em auth.uid()**

### Exemplo Correto:
```typescript
// ✅ CORRETO: Query pura, RLS decide
const { data: contratos } = await supabase
  .from('contratos')
  .select('*')
```

### Exemplo Incorreto:
```typescript
// ❌ ERRADO: Filtro manual de empresa_id
const { data: contratos } = await supabase
  .from('contratos')
  .select('*')
  .eq('empresa_id', usuario.empresa_id)  // ❌ Duplicação de lógica
```

### Rationale:
- Backend é autoridade única de isolamento
- Frontend não deve conter lógica de tenant
- Segurança garantida pelo banco, não pelo código
- Facilita manutenção (regra em 1 lugar)

---

## ⏳ 2. Loading States em Finally

### Decisão:
`setLoading(false)` SEMPRE deve estar no bloco `finally`.

### Regra Imutável:
```typescript
const loadData = async () => {
  try {
    setLoading(true)
    // ... operações
  } catch (error) {
    // ... tratamento de erro
  } finally {
    setLoading(false)  // ✅ SEMPRE aqui
  }
}
```

### Rationale:
- Garante que loading sempre termina
- Previne loading infinito em caso de erro
- UX consistente em todos os cenários

---

## 🧮 3. Cálculos no Backend (Nunca Recalcular Frontend)

### Decisão:
Cálculos de negócio (margem, saldo, etc.) são feitos por triggers no banco.

### Regra Imutável:
- ✅ **Frontend apenas EXIBE valores calculados**
- ❌ **Frontend NUNCA recalcula margem, saldo, etc.**
- ✅ **Triggers mantêm dados sincronizados**

### Exemplo:
```typescript
// ✅ CORRETO: Apenas exibir
<span>Margem: {item.margem_percentual}%</span>

// ❌ ERRADO: Recalcular no frontend
const margem = ((item.valor_unitario - item.custo_medio) / item.valor_unitario) * 100
<span>Margem: {margem}%</span>
```

### Rationale:
- Single Source of Truth (banco)
- Previne inconsistências
- Performance (cálculo 1 vez no trigger)

---

## 🔗 4. Context Hierarchy

### Decisão:
Hierarquia de contextos é fixa e obrigatória.

### Regra Imutável:
```
RootLayout
└── AuthProvider
    └── EmpresaProvider
        └── children
```

### Rationale:
- EmpresaProvider depende de AuthContext (usuario)
- Ordem garante dados disponíveis quando necessário
- Previne erros de "context undefined"

---

## 🗑️ 5. Soft Delete (Nunca Hard Delete)

### Decisão:
Registros NUNCA são deletados fisicamente.

### Regra Imutável:
- ✅ **Marcar deleted_at com timestamp**
- ✅ **Queries filtram deleted_at IS NULL**
- ✅ **Manter histórico e auditoria**

### Exemplo:
```typescript
// ✅ CORRETO: Soft delete
const { error } = await supabase
  .from('contratos')
  .update({
    deleted_at: new Date().toISOString(),
    deleted_by: user.id
  })
  .eq('id', contratoId)

// ✅ CORRETO: Filtrar deletados
const { data } = await supabase
  .from('contratos')
  .select('*')
  .is('deleted_at', null)
```

### Rationale:
- Auditoria completa
- Recuperação de dados
- Compliance com LGPD

---

## 🔐 6. Verificação de usuario.ativo

### Decisão:
Middleware verifica `usuario.ativo` em TODA request autenticada.

### Regra Imutável:
- ✅ **Middleware consulta usuarios.ativo**
- ✅ **Se inativo → signOut + redirect**
- ✅ **Verificação em CADA request**

### Rationale:
- Segurança em tempo real
- Admin pode desativar usuário instantaneamente
- Previne acesso após desativação

---

## 📝 7. Validação Frontend é UX (Backend é Segurança)

### Decisão:
Validação frontend é para UX. Segurança real é RLS + backend.

### Regra Imutável:
- ✅ **Frontend: React Hook Form + Zod (feedback rápido)**
- ✅ **Backend: RLS + constraints (segurança real)**
- ❌ **NUNCA confiar apenas em validação frontend**

### Rationale:
- Validação frontend pode ser bypassed (DevTools)
- RLS + constraints são obrigatórios
- UX melhor com validação dupla

---

## 🚫 8. Nunca Expor SERVICE_ROLE_KEY

### Decisão:
Frontend usa APENAS `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Regra Imutável:
- ✅ **Frontend: ANON_KEY**
- ✅ **Backend/Server Actions: SERVICE_ROLE_KEY (se necessário)**
- ❌ **NUNCA expor SERVICE_ROLE_KEY no frontend**

### Rationale:
- SERVICE_ROLE_KEY bypassa RLS
- Exposição = vulnerabilidade crítica
- ANON_KEY respeita RLS policies

---

## 🔄 9. Estado de Loading e Error Handling

### Decisão:
Toda operação assíncrona tem loading state e error handling.

### Regra Imutável:
```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleAction = async () => {
  try {
    setLoading(true)
    setError(null)
    // ... operação
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

### Rationale:
- UX consistente
- Feedback visual obrigatório
- Nunca deixar usuário sem informação

---

## 🔒 10. Redirect Param Seguro (Anti-Open-Redirect)

### Decisão:
Redirect param SEMPRE validado para prevenir open redirect.

### Regra Imutável:
```typescript
const isSafePath =
  redirect.startsWith('/') &&
  !redirect.startsWith('//') &&
  !redirect.includes('://')

if (isSafePath) {
  router.push(redirect)
} else {
  router.push('/dashboard')  // Fallback seguro
}
```

### Rationale:
- Previne ataques de phishing
- Bloqueia redirecionamento para sites externos
- Segurança básica obrigatória

---

## 📊 11. Types TypeScript Explícitos

### Decisão:
Sempre usar types explícitos. Nunca usar `any`.

### Regra Imutável:
- ✅ **Types explícitos para props, estados, funções**
- ✅ **Interfaces para objetos complexos**
- ❌ **NUNCA usar `any`**
- ✅ **Usar `unknown` + type guard se necessário**

### Rationale:
- Type safety = menos bugs
- Autocomplete melhor
- Refactoring mais seguro

---

## 🔄 12. useEffect Dependencies Corretas

### Decisão:
Array de dependências deve incluir TODAS as variáveis usadas.

### Regra Imutável:
```typescript
// ✅ CORRETO
useEffect(() => {
  if (usuario) {
    loadData()
  }
}, [usuario])  // usuario está nas deps

// ❌ ERRADO
useEffect(() => {
  if (usuario) {
    loadData()
  }
}, [])  // usuario faltando = stale closure
```

### Rationale:
- Previne stale closures
- React Rules of Hooks
- Comportamento previsível

---

## 📝 Histórico de Decisões

| Data | Decisão | Rationale | Story |
|------|---------|-----------|-------|
| 2026-02-18 | Multi-tenant via RLS | Backend decide isolamento | 2.2 |
| 2026-02-18 | Loading em finally | Previne loading infinito | 2.1 |
| 2026-02-18 | Context hierarchy | EmpresaProvider após AuthProvider | 2.2 |
| 2026-02-18 | usuario.ativo no middleware | Segurança em tempo real | 2.3 |
| 2026-02-18 | Anti-open-redirect | Previne phishing | 2.3 |

---

**Última atualização:** 2026-02-18
**Responsável:** Arquitetura do Projeto
