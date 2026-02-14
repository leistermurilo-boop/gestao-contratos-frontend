# Story 6.4: Editar Contrato

**Tipo:** Feature | **Prioridade:** Média | **Estimativa:** 3 horas | **Responsável:** @dev

## 🎯 Objetivo
Página de edição de contrato (reutilizando ContratoForm).

## 📁 Arquivos
```
app/(dashboard)/contratos/[id]/editar/page.tsx        # ✅ Criar
```

## 🔨 Implementação
- Buscar contrato por ID
- Preencher form com valores atuais
- Reutilizar ContratoForm (modo edição)
- **REGRA:** empresa_id não pode ser alterado

## ✅ Critérios
- [ ] Form pré-preenchido
- [ ] Update funciona
- [ ] **TESTE:** empresa_id removido do update

**Status:** ⏳ Aguardando | **Criado:** @sm (River)
