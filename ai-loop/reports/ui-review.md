# UI Review Report

> Relatório de revisão de UI/UX gerado pelo agente @ux-design-expert (@Uma).
> Alimenta o loop de engenharia com diagnósticos visuais, problemas de acessibilidade
> e inconsistências de design system.
>
> Agente responsável: `.claude/commands/AIOS/agents/ux-design-expert.md`
> Comandos de entrada: `*scan`, `*audit`, `*a11y-check`

---

## Review

**Date:** —
**Session:** —
**Page / Component:** —
**URL testada:** —
**User Profile simulado:** —

---

## 1. Consistência Visual

### Problemas identificados

| Componente | Problema | Severidade |
|------------|---------|-----------|
| | | baixa / média / alta |

### Tokens violados

```
Cor hardcoded:     ex. #0F172A em vez de bg-navy-900
Espaçamento:       ex. mt-[13px] em vez de mt-3
Tipografia:        ex. text-[15px] em vez de text-sm
```

---

## 2. Acessibilidade (WCAG AA)

| Critério | Status | Notas |
|---------|--------|-------|
| Contraste de cor (4.5:1 texto) | ✅ / ❌ | |
| Focus visível em elementos interativos | ✅ / ❌ | |
| Labels em inputs de formulário | ✅ / ❌ | |
| Alt text em imagens | ✅ / ❌ | |
| Hierarquia de headings (h1→h2→h3) | ✅ / ❌ | |
| Navegação por teclado | ✅ / ❌ | |
| ARIA roles onde necessário | ✅ / ❌ | |

**Score estimado:** — / 100

---

## 3. Atomic Design — Saúde dos Componentes

### Atoms
| Componente | Variantes | Problema | Ação |
|------------|-----------|---------|------|
| Button | | | |
| Input | | | |
| Badge | | | |

### Molecules
| Componente | Problema | Ação |
|------------|---------|------|
| | | |

### Organismos com redundância detectada
```

```

---

## 4. UX — Fluxo e Usabilidade

**Fluxo testado:**

**Friction points identificados:**
1.
2.

**Micro-interações ausentes:**

**Feedback ao usuário (loading, error, success):**
- Loading states: ✅ / ❌
- Error states: ✅ / ❌
- Empty states: ✅ / ❌
- Success feedback: ✅ / ❌

---

## 5. Mobile / Responsividade

| Breakpoint | Status | Notas |
|-----------|--------|-------|
| sm (640px) | ✅ / ❌ | |
| md (768px) | ✅ / ❌ | |
| lg (1024px) | ✅ / ❌ | |

---

## 6. Recomendações @ux-design-expert

**Prioridade alta:**
-

**Prioridade média:**
-

**Prioridade baixa (polish):**
-

**Componentes a refatorar:**
-

**Próximo comando sugerido:** `*build` / `*consolidate` / `*tokenize`

---

## Status

- [ ] Review realizado pelo @ux-design-expert
- [ ] Recomendações aprovadas pelo @architect
- [ ] Itens de alta prioridade adicionados ao fix-plan.md
- [ ] Implementado pelo @dev
- [ ] Validado pelo @qa
