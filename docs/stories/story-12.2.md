# Story 12.2: Testes de Perfil (Matriz de Permissões)

**Tipo:** QA | **Prioridade:** Alta | **Estimativa:** 2h | **Responsável:** @qa/@dev
**Fase:** 12 — Deploy

## 🎯 Objetivo
Validação manual completa da matriz de permissões por perfil. Garantir que cada perfil vê apenas o que deve ver, tanto na UI (ProtectedRoute) quanto no banco (RLS).

## 📁 Arquivos
```
docs/tests/matriz-permissoes.md      # ✅ CRIAR — checklist de testes manuais
```

## 🔑 Matriz de Permissões (a testar)

| Módulo / Ação | admin | juridico | financeiro | compras | logistica |
|---------------|-------|----------|------------|---------|-----------|
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

## 🔨 Implementação

### Pré-requisitos
```
Criar 5 usuários de teste (um por perfil) via painel admin:
  admin_teste@teste.com     → perfil: admin
  juridico_teste@teste.com  → perfil: juridico
  financeiro_teste@teste.com → perfil: financeiro
  compras_teste@teste.com   → perfil: compras
  logistica_teste@teste.com → perfil: logistica
```

### Cenários de Teste

**1. Logistica NÃO vê custos (crítico — RLS)**
- Login como logistica → acessar `/dashboard/custos` → deve ser redirecionado
- Tentar `custosService.getAll()` via DevTools → deve retornar [] (RLS bloqueia)
- Histórico de custos de item (`/contratos/[id]/itens/[itemId]/custos`) → ProtectedRoute

**2. Custos imutáveis**
- Login como admin → página de histórico de custos → sem botão Editar/Excluir
- Verificar que `custos_item` não tem `deleted_at` na UI e no banco

**3. Validação de saldo AF**
- Emitir AF com quantidade > saldo_quantidade do item → erro esperado
- Registrar entrega com quantidade > saldo_af → erro esperado

**4. Financeiro não registra entregas**
- Login como financeiro → Detalhes de AF → botão "Registrar Entrega" NÃO deve aparecer
- Acessar `/dashboard/autorizacoes/[id]/entregas/nova` diretamente → ProtectedRoute

**5. Admin-only**
- Login como juridico/financeiro/compras/logistica:
  - `/dashboard/usuarios` → redirecionado
  - `/dashboard/empresas` → redirecionado
  - Botão "Arquivar Contrato" → não visível

**6. Apenas admin e compras emitem AF**
- Login como juridico → `/dashboard/autorizacoes` → botão "Emitir AF" NÃO aparece
- Login como compras → `/dashboard/autorizacoes` → botão "Emitir AF" APARECE

### Arquivo `docs/tests/matriz-permissoes.md`
Criar checklist marcável com todos os cenários acima para rastreabilidade.

## ✅ Critérios
- [x] Todos os 5 perfis testados manualmente
- [x] Logistica bloqueada em custos (UI + RLS confirmados)
- [x] Validações de saldo funcionando (AF e entrega)
- [x] Custos não têm botões de editar/excluir
- [x] Admin-only pages protegidas
- [x] Documento de teste criado em docs/tests/

**Status:** ✅ Concluída | **Criado:** @sm/@architect — 2026-02-21 | **Concluído:** 2026-02-20
