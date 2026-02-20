# Story 6.2: Criar Contrato

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 5 horas | **Responsável:** @dev

## 🎯 Objetivo
Formulário de criação de contrato com upload de documento.

## 📁 Arquivos
```
app/(dashboard)/contratos/novo/page.tsx              # ✅ Criado
app/(dashboard)/contratos/page.tsx                   # ✅ Modificado — botão "Novo Contrato"
components/forms/contrato-form.tsx                   # ✅ Criado
components/ui/form.tsx                               # ✅ Adicionado (shadcn/ui)
components/ui/textarea.tsx                           # ✅ Adicionado (shadcn/ui)
```

## 🔨 Implementação
- React Hook Form + Zod (contratoSchema com 10 campos + validação de datas)
- Select de CNPJ carregado via Supabase (RLS filtra automaticamente)
- Upload documento bucket `contratos` com path `empresa_id/contrato_${numero}_${ts}.ext`
- empresa_id NÃO passado na criação (RLS injeta automaticamente — Decisão #1)
- Redirect para `/dashboard/contratos/[id]` após criação

## ✅ Critérios
- [x] Formulário valida com Zod (campos required + data_vigencia_inicio <= fim)
- [x] Upload funciona com path correto (empresa_id/contrato_*.ext)
- [x] Redirect para detalhes após criar
- [x] empresa_id não passado na query
- [x] Upload opcional — contrato pode ser criado sem documento
- [x] Loading state "Salvando..." durante submit
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
