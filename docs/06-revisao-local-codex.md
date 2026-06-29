# Revisao Local com Codex

Este documento define como usar o Codex localmente como revisor de codigo durante o desenvolvimento.

## Objetivo

Permitir que o desenvolvedor peca uma revisao sob demanda, direto no prompt da maquina, antes de commit ou Pull Request.

A revisao deve validar:

- Aderencia ao teste tecnico da HIT Communications.
- Aderencia a Clean Architecture.
- Aderencia a DDD pragmatico.
- Qualidade de codigo.
- Baixo acoplamento.
- Alta coesao.
- Validacao, autenticacao, historico e testes.

## Arquivos Criados Para Revisao

### `AGENTS.md`

Arquivo de orientacao duravel do repositorio.

O Codex usa esse arquivo como guia do projeto, inclusive para revisoes.

### `.codex/code-standards.md`

Arquivo com os padroes de codigo, arquitetura, dominio, API, validacao, historico e testes.

Use este arquivo como checklist principal de revisao.

### `.codex/local-review-prompt.md`

Prompt pronto para pedir revisao local.

Ele explica:

- O papel do Codex.
- Quais arquivos ler.
- Como descobrir alteracoes.
- Quais criterios aplicar.
- Qual formato de resposta usar.

### `.codex/review-guidelines.md`

Contrato mais rigido de revisao, com foco em decisao estruturada.

Pode ser usado quando voce quiser uma resposta mais formal ou transformar a revisao em automacao depois.

## Como Pedir Revisao No Codex

### Revisar Alteracoes Locais Nao Commitadas

Use este pedido:

```txt
Use .codex/local-review-prompt.md e revise minhas alteracoes locais ainda nao commitadas.
```

O Codex deve usar:

```bash
git status
git diff
```

### Revisar Apenas Alteracoes Staged

Use este pedido:

```txt
Use .codex/local-review-prompt.md e revise apenas minhas alteracoes staged.
```

O Codex deve usar:

```bash
git diff --cached
```

### Revisar Contra Uma Branch

Use este pedido:

```txt
Use .codex/local-review-prompt.md e revise as alteracoes de HEAD contra main.
```

O Codex deve usar:

```bash
git diff main...HEAD
```

Troque `main` por `develop`, `master` ou a branch base real do projeto.

## Fluxo Pratico Recomendado

1. Implementar uma mudanca pequena.
2. Rodar testes locais relevantes.
3. Pedir revisao ao Codex usando `.codex/local-review-prompt.md`.
4. Corrigir achados `P0` e `P1`.
5. Avaliar achados `P2` e `P3`.
6. Fazer commit semantico.

## Formato Esperado Da Revisao

A resposta do Codex deve conter:

- Decisao: `Aprovado` ou `Solicitar alteracoes`.
- Resumo curto.
- Achados bloqueantes `P0/P1`.
- Achados nao bloqueantes `P2/P3`.
- Testes faltantes ou recomendados.
- Perguntas abertas, somente quando impedirem uma conclusao segura.

## Severidade

- `P0`: problema critico, risco de seguranca, perda de dados ou quebra central do sistema.
- `P1`: deve corrigir antes de aprovar.
- `P2`: deve corrigir quando possivel, mas nao bloqueia necessariamente.
- `P3`: melhoria menor.

## Quando Pedir Revisao

Peca revisao local:

- Antes de commitar um use case novo.
- Antes de criar ou alterar entidade, aggregate, Value Object ou Domain Event.
- Antes de alterar Prisma schema ou migrations.
- Antes de alterar fluxo de autenticacao.
- Antes de alterar validacao Zod.
- Antes de alterar RF06/historico.
- Antes de abrir PR.

## O Que Nao Fazer

- Nao pedir revisao do repositorio inteiro sem necessidade.
- Nao misturar muitas features na mesma revisao.
- Nao pedir para o Codex corrigir automaticamente se o objetivo for apenas auditoria.
- Nao ignorar achados `P0` ou `P1`.

## Evolucao Futura

Se depois voce quiser automatizar, estes mesmos arquivos podem ser usados em:

- pre-push local.
- hook customizado.
- GitHub Actions.
- revisao automatica em Pull Request.

Por enquanto, o uso principal definido e revisao local sob demanda.
