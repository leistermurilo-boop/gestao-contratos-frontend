# Story 6.2: Criar Contrato

**Tipo:** Feature | **Prioridade:** Alta | **Estimativa:** 5 horas | **Responsável:** @dev

## 🎯 Objetivo
Formulário de criação de contrato com upload de documento.

## 📁 Arquivos
```
app/(dashboard)/contratos/novo/page.tsx               # ✅ Criar
components/forms/contrato-form.tsx                    # ✅ Criar
```

## 🔨 Implementação
- React Hook Form + Zod (contratoSchema)
- Select de CNPJ (da empresa)
- Upload documento (bucket: contratos)
- **REGRA UPLOAD:** Path `empresa_id/contrato_${numero}.pdf`
- **REGRA RLS:** NUNCA passar empresa_id manualmente

## ✅ Critérios
- [ ] Formulário valida com Zod
- [ ] Upload funciona com path correto
- [ ] Redirect para detalhes após criar
- [ ] **TESTE:** empresa_id não passado na query

**Status:** ⏳ Aguardando | **Criado:** @sm (River)
