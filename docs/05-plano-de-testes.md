# Plano de Testes

Ferramenta aprovada:

- Jest.

## Estrategia

Usar dois niveis principais de testes:

- Testes unitarios para use cases.
- Testes e2e para endpoints principais.

## Testes Unitarios

Os testes unitarios devem validar regras de negocio sem depender de banco real.

Padrao:

- Entidades de dominio testadas diretamente quando protegerem invariantes.
- Use cases testados diretamente.
- Repositories mockados.
- Clock controlado quando houver datas automaticas.
- Domain Events validados quando fizerem parte do comportamento observado.

## Testes de Dominio

Cenarios:

- `Incident.resolve()` deve alterar status e data de resolucao conforme regra.
- `Incident.resolve()` deve rejeitar incidente ja resolvido.
- `Incident.changeStatus()` deve impedir transicao para `RESOLVED` no fluxo generico.
- `Incident.softDelete()` deve preencher `deletedAt`.
- Entidades nao devem permitir mutacao livre fora de metodos de dominio.
- Value Objects devem rejeitar valores invalidos quando existirem.

## Casos Unitarios Obrigatorios

### Criacao de Incidente

Cenarios:

- Deve criar incidente com dados validos.
- Deve rejeitar dados invalidos.
- Deve iniciar com status `OPEN`.
- Deve validar responsavel existente, se a regra for implementada no use case.

### Atualizacao de Incidente

Cenarios:

- Deve atualizar titulo.
- Deve atualizar descricao.
- Deve atualizar prioridade.
- Deve atualizar responsavel.
- Deve atualizar status permitido.
- Deve rejeitar mudanca para `RESOLVED` no endpoint/use case generico de atualizacao.
- Deve gerar historico para cada campo alterado.
- Nao deve gerar historico para campos sem alteracao.
- Deve persistir atualizacao e historico na mesma Unit of Work.

### Resolucao de Incidente

Cenarios:

- Deve definir status como `RESOLVED`.
- Deve preencher `resolvedAt` automaticamente.
- Deve gerar historico de status.
- Deve rejeitar resolucao de incidente inexistente.
- Deve rejeitar resolucao de incidente ja resolvido.

### Filtros Combinados

Cenarios:

- Deve filtrar por status.
- Deve filtrar por prioridade.
- Deve filtrar por categoria.
- Deve filtrar por responsavel.
- Deve filtrar por data de criacao.
- Deve filtrar por data de resolucao.
- Deve combinar multiplos filtros na mesma consulta.
- Deve respeitar paginacao padrao.
- Deve respeitar limite maximo de paginacao.
- Deve ordenar por `createdAt desc` por padrao.
- Deve ignorar registros com soft delete.

### Soft Delete

Cenarios:

- Deve marcar `deletedAt` ao remover logicamente um recurso.
- Nao deve retornar registros removidos em consultas padrao.
- Deve impedir operacoes de negocio em incidentes removidos, quando aplicavel.

### Historico de Alteracoes

Cenarios:

- Deve registrar `field`.
- Deve registrar `oldValue`.
- Deve registrar `newValue`.
- Deve registrar `changedById`.
- Deve registrar `changedAt`.
- Deve persistir historico na mesma transacao da atualizacao.
- Nao deve depender de event handler assincrono para historico obrigatorio.

## Testes E2E

Objetivo:

- Validar integracao entre rotas, validacao, autenticacao e persistencia.

Endpoints recomendados para cobertura e2e:

```txt
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/incidents
GET    /api/v1/incidents
GET    /api/v1/incidents/:id
PATCH  /api/v1/incidents/:id
PATCH  /api/v1/incidents/:id/resolve
DELETE /api/v1/incidents/:id
GET    /api/v1/incidents/:id/history
```

Decisao aprovada:

- Usar unit tests fortes para use cases.
- Usar alguns testes e2e com PostgreSQL real para fluxos principais de auth/incidents.

## Banco em Testes

Opcoes possiveis:

- Banco PostgreSQL em Docker para e2e.
- Banco separado definido por `DATABASE_URL_TEST`.

Recomendacao:

- Usar banco PostgreSQL real para e2e, pois o projeto usa Prisma e PostgreSQL.
- Rodar migrations antes da suite e2e.

## Coverage

Diferencial recomendado:

- Gerar relatorio de cobertura.

Meta inicial recomendada:

```txt
80%
```

Observacao:

- O enunciado cita cobertura como diferencial, nao como obrigatorio.

## GitHub Actions

Pipeline recomendado:

```txt
checkout
setup-node
install dependencies
prisma generate
lint
test
build
```

Quando houver e2e com PostgreSQL:

- Adicionar service container de PostgreSQL no workflow.
- Definir `DATABASE_URL_TEST`.
- Rodar migrations antes dos testes e2e.
