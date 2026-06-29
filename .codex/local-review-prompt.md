# Prompt Local de Revisao com Codex

Use este prompt quando quiser pedir uma revisao local das suas alteracoes no Codex.

## Prompt Para Colar No Codex

```txt
Quero que voce atue como revisor senior deste projeto.

Objetivo:
Revisar minhas alteracoes locais e dizer se elas cumprem os requisitos do teste tecnico e os padroes arquiteturais do projeto.

Contexto obrigatorio:
- Leia AGENTS.md.
- Leia .codex/code-standards.md.
- Leia os documentos em docs/ que forem relevantes para a mudanca.

Escopo da revisao:
- Revise apenas arquivos modificados e dependencias diretas necessarias para entender a mudanca.
- Nao edite arquivos.
- Nao faca refatoracoes.
- Nao avalie codigo nao relacionado, a menos que a alteracao atual dependa dele.

Como descobrir as alteracoes:
- Se eu nao especificar nada, use git status e git diff para revisar alteracoes locais ainda nao commitadas.
- Se eu disser "staged", use git diff --cached.
- Se eu disser uma branch base, compare com essa branch usando git diff BASE...HEAD.

Criterios principais:
- Aderencia estrita a Clean Architecture.
- Aderencia a DDD pragmatico.
- CQRS leve deve separar commands e queries.
- Entidades de dominio devem ser ricas, com estado privado e alteracoes por metodos.
- Incident e User devem ser tratados como aggregate roots.
- IncidentHistory deve ser registro de auditoria, nao dono do ciclo de vida do incidente.
- Value Objects so devem existir quando protegerem regra real ou melhorarem clareza.
- Domain Events nao podem substituir transacoes ou historico obrigatorio.
- Use cases devem usar Unit of Work quando houver transacao.
- Use cases nao podem importar Prisma, Nest HTTP ou detalhes de infraestrutura.
- Controllers nao podem conter regra de negocio.
- Repository Pattern deve ser respeitado.
- Soft delete deve ser respeitado nas entidades e consultas padrao.
- DELETE /api/v1/incidents/:id deve executar soft delete.
- Paginacao deve respeitar page padrao 1, limit padrao 10 e limit maximo 100.
- Validacao deve usar Zod e retornar 422 no formato aprovado.
- Rotas devem estar sob /api/v1.
- JWT deve proteger rotas privadas.
- JWT deve usar apenas access token no MVP.
- Senhas devem usar Argon2id.
- RF06 deve registrar historico campo a campo com changedById.
- Atualizacao e historico devem ocorrer na mesma transacao.
- Resolver incidente deve acontecer apenas pelo endpoint/use case dedicado de resolve.
- O patch generico nao pode aceitar status RESOLVED.
- Testes devem cobrir comportamento novo ou alterado.

Formato da resposta:
1. Decisao: Aprovado ou Solicitar alteracoes.
2. Resumo curto.
3. Achados bloqueantes, com severidade P0/P1, arquivo, linha e motivo.
4. Achados nao bloqueantes, com severidade P2/P3.
5. Testes faltantes ou recomendados.
6. Perguntas abertas, somente se impedirem uma conclusao segura.

Se nao houver problemas relevantes, diga claramente que a revisao foi aprovada e liste qualquer risco residual.
```

## Variantes Uteis

### Revisar Tudo Que Esta Modificado Localmente

```txt
Use .codex/local-review-prompt.md e revise minhas alteracoes locais ainda nao commitadas.
```

### Revisar Apenas Arquivos Staged

```txt
Use .codex/local-review-prompt.md e revise apenas minhas alteracoes staged.
```

### Revisar Uma Branch Contra Outra

```txt
Use .codex/local-review-prompt.md e revise as alteracoes de HEAD contra main.
```

### Revisao Com Foco Especifico

```txt
Use .codex/local-review-prompt.md e revise minhas alteracoes com foco em DDD, Clean Architecture e RF06.
```

## Observacao Importante

O arquivo `AGENTS.md` e lido pelo Codex como orientacao duravel do repositorio.

Os arquivos dentro de `.codex/` sao arquivos de apoio versionados. Para garantir que sejam usados, mencione explicitamente o arquivo no prompt, como nos exemplos acima.
