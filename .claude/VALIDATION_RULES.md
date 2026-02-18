# 🛡️ REGRAS DE VALIDAÇÃO OBRIGATÓRIAS

**IMPORTANTE:** @analyst e @dev devem ler este arquivo ANTES de validar/implementar qualquer story.

---

## 📋 PRÉ-IMPLEMENTAÇÃO (Obrigatório)

Antes de @dev implementar QUALQUER story, @analyst DEVE verificar:

### ✅ Checklist de 5 Pontos:

1. **CONSISTÊNCIA ARQUITETURAL**
   - Story usa RLS (sem .eq manual em empresa_id)?
   - Padrão alinhado com stories anteriores?
   - Sem duplicação de regra de negócio?

2. **DEPENDÊNCIAS TÉCNICAS**
   - Todas dependências já implementadas?
   - Ordem de execução correta?
   - Imports disponíveis?

3. **VALIDAÇÃO DE DADOS**
   - Validações no lugar correto (client vs server)?
   - Loading em finally?
   - Error handling adequado?

4. **PONTOS DE FALHA COMUNS**
   - useEffect com deps corretas?
   - Sem risco de loop infinito?
   - setState em finally?

5. **GAPS DE IMPLEMENTAÇÃO**
   - Código de exemplo completo?
   - Instruções claras?
   - Arquivos críticos incluídos?

---

## ✅ PÓS-IMPLEMENTAÇÃO (Obrigatório)

Após @dev implementar, @analyst DEVE verificar:

1. Código segue docs/ARCHITECTURAL_DECISIONS.md?
2. RLS implementado corretamente?
3. Sem duplicação de regras?
4. Loading states corretos?
5. Types corretos?

---

## 🚨 DECISÕES IMUTÁVEIS

Consultar sempre: docs/ARCHITECTURAL_DECISIONS.md

- Multi-tenant via RLS (nunca .eq manual)
- Loading em finally (sempre)
- Cálculos no backend (nunca recalcular frontend)
- Context hierarchy (Auth → Empresa → children)
- Soft delete (filtrar deleted_at IS NULL)

---

**@analyst e @dev: Leiam este arquivo ANTES de iniciar qualquer story.**
