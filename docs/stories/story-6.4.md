# Story 6.4: Editar Contrato

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 3 horas | **Responsável:** @dev

## 🎯 Objetivo
Página de edição de contrato (reutilizando ContratoForm).

## 📁 Arquivos
```
components/forms/contrato-form.tsx                    # 🔄 Atualizado — suporte mode='edit'
app/(dashboard)/contratos/[id]/editar/page.tsx        # ✅ Criado
```

## 🔨 Implementação
- `ContratoForm` estendido com props `mode`, `contratoId`, `initialData`
- `useEffect` com `reset()` para pré-preencher campos em modo edição
- `onSubmit` bifurca: `create()` vs `update()` conforme mode
- Upload preserva `anexo_url` existente se nenhum novo arquivo enviado
- `cancelHref` adapta: edit→`/contratos/[id]`, create→`/contratos`
- Página `/[id]/editar`: `'use client'`, `useParams()`, `getById()` com LoadingSkeleton
- **REGRA:** `ContratoUpdateSeguro` (Omit empresa_id + id) — compile-time safety

## ✅ Critérios
- [x] Form pré-preenchido com dados do contrato
- [x] Update funciona — `contratosService.update()` com `ContratoUpdateSeguro`
- [x] **TESTE:** empresa_id e id removidos do update (Omit no tipo)
- [x] LoadingSkeleton durante fetch
- [x] Not-found state se contrato não encontrado
- [x] Botão Cancelar → `/contratos/[id]`
- [x] Após salvar → redirect para `/contratos/[id]`
- [x] Arquivo atual exibido em modo edição (link "Ver documento")
- [x] TypeScript: 0 erros
- [x] ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
