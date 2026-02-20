# Story 7.2: Criar/Editar Item do Contrato

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 3 horas | **Responsável:** @dev

## 📁 Arquivos
```
components/forms/item-form.tsx                                      # ✅ NOVO
app/(dashboard)/contratos/[id]/itens/novo/page.tsx                  # ✅ NOVO
app/(dashboard)/contratos/[id]/itens/[itemId]/editar/page.tsx       # ✅ NOVO
```

## 🔨 Implementação
- `ItemForm`: React Hook Form + Zod, mode='create'|'edit'
- Campos: numero_item (opcional), descricao, unidade, quantidade, valor_unitario
- Create: recebe `cnpjId` do contrato (buscado pela página pai) → `itensService.create({ contrato_id, cnpj_id, ...values })`
- Edit: `itensService.update(itemId, { ...values })` — `ItemContratoUpdateSeguro` bloqueia campos imutáveis
- **REGRA:** NUNCA enviar `margem_atual`, `saldo_quantidade`, `valor_total` — GENERATED ALWAYS (Decisão #3)
- Redirect pós-save → `/contratos/[id]/itens`
- Página `/novo`: busca contrato para extrair cnpj_id
- Página `/[itemId]/editar`: busca item por ID para pré-preencher form

## ✅ Critérios
- [x] Form pré-preenchido em modo edição
- [x] Create funciona — cnpj_id injetado do contrato
- [x] Update funciona — campos GENERATED bloqueados
- [x] Redirect após salvar
- [x] Loading skeleton nas páginas
- [x] Not-found state
- [x] TypeScript: 0 erros | ESLint: 0 warnings

**Status:** ✅ Concluída | **Implementado:** @dev | **Data:** 2026-02-21
