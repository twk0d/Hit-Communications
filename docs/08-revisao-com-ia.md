# Revisão Automatizada com IA (Codex)

Este documento estabelece o fluxo de revisão de código contínua utilizando IA (Codex local) durante o ciclo de desenvolvimento, antes de a etapa de integração e testes em PR ocorrer.

## 1. O Que é e Qual o Objetivo?

O projeto conta com um framework de revisão sob demanda executado diretamente por inteligência artificial a nível local (na CLI). O objetivo é que o desenvolvedor obtenha uma auditoria imediata sobre seu código atual, garantindo aderência às regras do domínio, antes mesmo de realizar o commit.

O foco da IA **não é substituir** testes ou linters locais (como ESLint), mas avaliar fatores cognitivos que essas ferramentas não detectam, tais como:
- **Aderência à Clean Architecture e DDD:** O código no `use case` vazou informações de infraestrutura?
- **Regras de Negócio:** Foi esquecido o tratamento da regra de que "incidentes não podem ser resolvidos pelo endpoint genérico"?
- **Coesão e Acoplamento:** As entidades de domínio continuam puras?

---

## 2. Decisões Técnicas e Trade-offs

**Escolha:** Implementar um fluxo de revisão "shift-left" extremo (assistido por IA local antes do commit) em vez de focar puramente em regras de CI baseadas em PR.

**Alternativas consideradas:**
- **Code Review Humano via PR (Tradicional):** Excelente para troca de conhecimento em equipe, mas insere uma latência ("tempo de espera do colega aprovar") que prejudica a velocidade no escopo de um teste técnico/MVP isolado.
- **Ferramentas Estáticas (SonarQube):** Fortes em pegar anti-patterns genéricos e complexidade ciclomática, mas "cegas" quanto às regras de negócio específicas do projeto.

**Por que esta:** Promove a **autonomia** do desenvolvedor. Ao injetar o contexto (a "constituição" do projeto e regras do teste) na IA, conseguimos corrigir violações de arquitetura imediatamente.

---

## 3. Estrutura de Arquivos de Revisão

O "cérebro" das regras repousa em arquivos duráveis:

- `AGENTS.md` *(Root)*: A constituição absoluta. O Codex sempre lê isso primeiro para entender as fronteiras de arquitetura (Clean Architecture/DDD).
- `.codex/code-standards.md`: Padrões e checklist técnico voltados para API, segurança e testes.
- `.codex/local-review-prompt.md`: O "botão de disparo", um prompt pré-pronto que instrui exatamente qual comando a IA deve executar e qual formato de output gerar.
- `.codex/review-guidelines.md`: Contrato de severidades caso o output precise ser estruturado formalmente.

---

## 4. Fluxo Prático Recomendado

1. **Codificação:** O desenvolvedor implementa a feature ou ajusta algo pequeno (ex: RF06 Histórico).
2. **Revisão:** Em vez de abrir um PR ou buscar um avaliador, roda-se o prompt para a IA usando a branch de trabalho:
   ```txt
   Use .codex/local-review-prompt.md e revise minhas alterações locais ainda não commitadas.
   ```
   *(A IA executará `git diff` automaticamente por debaixo dos panos)*.
3. **Triagem de Achados:**
   - A IA classificará os pontos.
   - **P0 / P1:** Bloqueantes (ex: O Controller está instanciando o Prisma direto; resolve antes do commit).
   - **P2 / P3:** Melhorias ou formatações sugeridas (corrija se houver tempo).
4. **Correção e Commit:** O desenvolvedor aplica as correções recomendadas e realiza o commit semântico.
