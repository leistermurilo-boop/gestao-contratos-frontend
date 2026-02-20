# Matriz de Permissões — Testes de Perfil

**Story:** 12.2 | **Tipo:** QA Manual | **Data alvo:** Pré-deploy
**Responsável:** _________________________ | **Data de execução:** _____________

---

## Pré-requisitos

Antes de iniciar os testes, criar os seguintes usuários de teste via **painel admin** (`/dashboard/usuarios`):

| E-mail | Perfil |
|--------|--------|
| `admin_teste@teste.com` | admin |
| `juridico_teste@teste.com` | juridico |
| `financeiro_teste@teste.com` | financeiro |
| `compras_teste@teste.com` | compras |
| `logistica_teste@teste.com` | logistica |

> Todos os usuários devem pertencer à mesma empresa de teste.

---

## Matriz de Permissões

| Módulo / Ação | admin | juridico | financeiro | compras | logistica |
|---------------|:-----:|:--------:|:----------:|:-------:|:---------:|
| Contratos — listar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contratos — criar/editar | ✅ | ✅ | ❌ | ❌ | ❌ |
| Contratos — arquivar | ✅ | ❌ | ❌ | ❌ | ❌ |
| Itens — criar/editar | ✅ | ❌ | ❌ | ❌ | ❌ |
| Custos — listar/registrar | ✅ | ✅ | ✅ | ✅ | ❌ |
| AF — listar | ✅ | ✅ | ✅ | ✅ | ✅ |
| AF — emitir | ✅ | ❌ | ❌ | ✅ | ❌ |
| Entregas — listar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Entregas — registrar | ✅ | ✅ | ❌ | ✅ | ✅ |
| Reajustes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Usuários | ✅ | ❌ | ❌ | ❌ | ❌ |
| CNPJs / Empresas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Perfil próprio | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Referência de código:** `frontend/lib/constants/perfis.ts`
> **Segurança real:** RLS no banco (as permissões da UI são UX-level — Decisão #7)

---

## Cenários Críticos

### Cenário 1 — Logistica NÃO vê custos (crítico: UI + RLS)

- [ ] Login como `logistica_teste@teste.com`
- [ ] Acessar `/dashboard/contratos` → deve listar contratos (acesso liberado)
- [ ] Acessar `/dashboard/contratos/[id]/itens/[itemId]/custos` → deve exibir tela **"Acesso Negado"** (`ProtectedRoute` com `showError=true`)
- [ ] Abrir DevTools → Console → executar `custosService.getAll()` → deve retornar `[]` (RLS bloqueia no banco)
- [ ] Confirmar que nenhuma linha de custo aparece mesmo inspecionando o DOM

---

### Cenário 2 — Custos imutáveis (append-only)

- [ ] Login como `admin_teste@teste.com`
- [ ] Navegar até histórico de custos de qualquer item
- [ ] Confirmar que **não existe** botão "Editar" em nenhuma linha da tabela
- [ ] Confirmar que **não existe** botão "Excluir" em nenhuma linha da tabela
- [ ] Verificar no banco: tabela `custos_item` não possui coluna `deleted_at`

---

### Cenário 3 — Validação de saldo (AF e entrega)

- [ ] Login como `admin_teste@teste.com` ou `compras_teste@teste.com`
- [ ] Emitir AF com `quantidade` **maior** que `saldo_quantidade` do item → deve exibir erro de validação
- [ ] Emitir AF com `quantidade` **igual** a `saldo_quantidade` → deve funcionar
- [ ] Login como `admin_teste@teste.com` ou `logistica_teste@teste.com`
- [ ] Registrar entrega com `quantidade` **maior** que `saldo_af` da AF → deve exibir erro de validação
- [ ] Confirmar que `saldo_af` é calculado automaticamente pelo banco (campo GENERATED — não editável)

---

### Cenário 4 — Financeiro não registra entregas

- [ ] Login como `financeiro_teste@teste.com`
- [ ] Navegar até detalhes de uma AF em `/dashboard/autorizacoes/[afId]`
- [ ] Confirmar que o botão **"Registrar Entrega" NÃO aparece** na interface
- [ ] Acessar diretamente `/dashboard/autorizacoes/[afId]/entregas/nova` → deve exibir tela **"Acesso Negado"**
- [ ] Confirmar que nenhuma rota de criação de entrega é acessível por financeiro

---

### Cenário 5 — Páginas admin-only protegidas

Testar com cada perfil não-admin (`juridico`, `financeiro`, `compras`, `logistica`):

- [ ] `/dashboard/usuarios` → deve exibir **"Acesso Negado"**
- [ ] `/dashboard/empresas` → deve exibir **"Acesso Negado"**
- [ ] Na listagem de contratos → botão **"Arquivar"** NÃO deve aparecer para nenhum perfil exceto admin
- [ ] Na listagem de contratos → botão **"Novo Contrato"** só deve aparecer para admin e juridico

---

### Cenário 6 — Apenas admin e compras emitem AF

- [ ] Login como `juridico_teste@teste.com` → `/dashboard/autorizacoes` → botão **"Emitir AF" NÃO aparece**
- [ ] Login como `financeiro_teste@teste.com` → `/dashboard/autorizacoes` → botão **"Emitir AF" NÃO aparece**
- [ ] Login como `logistica_teste@teste.com` → `/dashboard/autorizacoes` → botão **"Emitir AF" NÃO aparece**
- [ ] Login como `compras_teste@teste.com` → `/dashboard/autorizacoes` → botão **"Emitir AF" APARECE**
- [ ] Login como `admin_teste@teste.com` → `/dashboard/autorizacoes` → botão **"Emitir AF" APARECE**

---

## Testes por Perfil

### Perfil: ADMIN

Login: `admin_teste@teste.com`

- [ ] Acessa `/dashboard` → carrega dashboard sem erros
- [ ] Acessa `/dashboard/contratos` → lista contratos
- [ ] Cria novo contrato → formulário abre, salva com sucesso
- [ ] Edita contrato existente → funciona
- [ ] Arquiva contrato → botão visível, ação executada
- [ ] Cria item em contrato → funciona
- [ ] Registra custo em item → funciona
- [ ] Emite AF → botão visível, formulário funciona
- [ ] Registra entrega → botão visível, funciona
- [ ] Acessa `/dashboard/usuarios` → lista usuários, pode convidar
- [ ] Acessa `/dashboard/empresas` → lista CNPJs
- [ ] Acessa `/dashboard/perfil` → pode editar nome e senha
- [ ] Vê aba/seção de Reajustes em contrato

---

### Perfil: JURIDICO

Login: `juridico_teste@teste.com`

- [ ] Acessa `/dashboard` → carrega dashboard
- [ ] Acessa `/dashboard/contratos` → lista contratos
- [ ] Cria novo contrato → funciona
- [ ] Edita contrato existente → funciona
- [ ] Botão **"Arquivar"** NÃO aparece
- [ ] Botão **"Criar Item"** NÃO aparece (apenas admin)
- [ ] Registra custo em item → funciona (juridico pode ver/registrar custos)
- [ ] AF — lista AFs → funciona; botão **"Emitir AF" NÃO aparece**
- [ ] Registra entrega → funciona
- [ ] Acessa `/dashboard/usuarios` → **"Acesso Negado"**
- [ ] Acessa `/dashboard/empresas` → **"Acesso Negado"**
- [ ] Vê aba/seção de Reajustes em contrato

---

### Perfil: FINANCEIRO

Login: `financeiro_teste@teste.com`

- [ ] Acessa `/dashboard` → carrega dashboard
- [ ] Acessa `/dashboard/contratos` → lista contratos (somente leitura)
- [ ] Botão **"Novo Contrato"** NÃO aparece
- [ ] Botão **"Editar Contrato"** NÃO aparece
- [ ] Registra custo em item → funciona (financeiro pode ver/registrar custos)
- [ ] AF — lista AFs → funciona; botão **"Emitir AF" NÃO aparece**
- [ ] Detalhes de AF → botão **"Registrar Entrega" NÃO aparece**
- [ ] Acessa `/dashboard/autorizacoes/[afId]/entregas/nova` → **"Acesso Negado"**
- [ ] Acessa `/dashboard/usuarios` → **"Acesso Negado"**
- [ ] Acessa `/dashboard/empresas` → **"Acesso Negado"**
- [ ] Aba Reajustes NÃO aparece (ou está oculta)

---

### Perfil: COMPRAS

Login: `compras_teste@teste.com`

- [ ] Acessa `/dashboard` → carrega dashboard
- [ ] Acessa `/dashboard/contratos` → lista contratos (somente leitura)
- [ ] Botão **"Novo Contrato"** NÃO aparece
- [ ] Botão **"Editar Contrato"** NÃO aparece
- [ ] Registra custo em item → funciona
- [ ] AF — lista AFs → funciona; botão **"Emitir AF" APARECE**
- [ ] Emite AF com sucesso
- [ ] Registra entrega → funciona
- [ ] Acessa `/dashboard/usuarios` → **"Acesso Negado"**
- [ ] Acessa `/dashboard/empresas` → **"Acesso Negado"**
- [ ] Aba Reajustes NÃO aparece

---

### Perfil: LOGISTICA

Login: `logistica_teste@teste.com`

- [ ] Acessa `/dashboard` → carrega dashboard
- [ ] Acessa `/dashboard/contratos` → lista contratos (somente leitura)
- [ ] Botão **"Novo Contrato"** NÃO aparece
- [ ] Botão **"Editar Contrato"** NÃO aparece
- [ ] Acessa página de custos de item → **"Acesso Negado"** (ProtectedRoute)
- [ ] Nenhum dado de custo retornado via API (RLS confirmar via DevTools)
- [ ] AF — lista AFs → funciona; botão **"Emitir AF" NÃO aparece**
- [ ] Registra entrega → funciona
- [ ] Acessa `/dashboard/usuarios` → **"Acesso Negado"**
- [ ] Acessa `/dashboard/empresas` → **"Acesso Negado"**
- [ ] Aba Reajustes NÃO aparece
- [ ] Aba Custos NÃO aparece em nenhum item

---

## Comportamento do ProtectedRoute

O componente `ProtectedRoute` (`frontend/components/common/protected-route.tsx`) tem dois modos:

| `showError` | Comportamento ao negar acesso |
|:-----------:|-------------------------------|
| `true` (padrão) | Exibe card **"Acesso Negado"** com perfil atual e botão "Voltar ao Dashboard" |
| `false` | Redireciona silenciosamente para `redirectTo` (padrão: `/dashboard`) |

> **Importante:** O ProtectedRoute é UX-level. O RLS no Supabase é a camada de segurança real — mesmo que o ProtectedRoute seja bypassado, o banco retornará dados vazios ou erro de permissão.

---

## Resultado dos Testes

| Perfil | Testado por | Data | Resultado |
|--------|-------------|------|-----------|
| admin | | | ⬜ Pendente |
| juridico | | | ⬜ Pendente |
| financeiro | | | ⬜ Pendente |
| compras | | | ⬜ Pendente |
| logistica | | | ⬜ Pendente |

**Cenários críticos:**

| Cenário | Resultado |
|---------|-----------|
| 1 — Logistica sem custos | ⬜ Pendente |
| 2 — Custos imutáveis | ⬜ Pendente |
| 3 — Validação de saldo | ⬜ Pendente |
| 4 — Financeiro sem entregas | ⬜ Pendente |
| 5 — Admin-only pages | ⬜ Pendente |
| 6 — Emissão de AF | ⬜ Pendente |

---

**Observações gerais:**

```
[Anotar aqui qualquer comportamento inesperado encontrado durante os testes]
```

---

*Gerado em: 2026-02-20 | Story 12.2 | Sistema de Gestão de Contratos*
