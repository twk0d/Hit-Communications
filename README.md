# HIT Communications - Teste Tecnico TypeScript

API REST para gerenciamento de incidentes operacionais, desenvolvida como teste tecnico para a HIT Communications.

O projeto implementa um monolito modular em NestJS com Clean Architecture orientada a DDD pragmatico: entidades ricas, aggregates bem delimitados, use cases explicitos, Repository Pattern, Unit of Work, CQRS leve com `@nestjs/cqrs`, Prisma ORM isolado na infraestrutura e JWT com access token no MVP.

## Stack

- NestJS e TypeScript.
- npm.
- Prisma ORM.
- PostgreSQL.
- Docker e Docker Compose.
- Zod.
- Jest e Supertest.
- Swagger/OpenAPI.
- JWT.
- Argon2id.
- Pino/NestJS-Pino.
- GitHub Actions.

## Documentacao

As decisoes e detalhes do projeto estao documentados em:

- [docs/01-requisitos-do-teste.md](docs/01-requisitos-do-teste.md)
- [docs/02-decisoes-tecnicas.md](docs/02-decisoes-tecnicas.md)
- [docs/03-modelagem-e-api.md](docs/03-modelagem-e-api.md)
- [docs/04-validacao-erros-e-historico.md](docs/04-validacao-erros-e-historico.md)
- [docs/05-plano-de-testes.md](docs/05-plano-de-testes.md)
- [docs/06-revisao-local-codex.md](docs/06-revisao-local-codex.md)
- [docs/07-arquitetura-detalhada.md](docs/07-arquitetura-detalhada.md)
- [docs/08-pos-mvp.md](docs/08-pos-mvp.md)
- [docs/09-plano-de-implementacao.md](docs/09-plano-de-implementacao.md)
- [docs/10-plano-logs-estruturados.md](docs/10-plano-logs-estruturados.md)
- [docs/11-plano-benchmark-k6.md](docs/11-plano-benchmark-k6.md)

Collection Insomnia:

- [docs/Insomnia_2026-06-30.yaml](docs/Insomnia_2026-06-30.yaml)

## Requisitos Locais

- Node.js 24 LTS.
- npm.
- Docker Desktop.

## Configuracao

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Variaveis principais:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://hit:hit@localhost:5432/hit_incidents?schema=public"
DATABASE_URL_TEST="postgresql://hit:hit@localhost:5432/hit_incidents?schema=e2e_test"
JWT_SECRET="change-me-in-local-development"
JWT_EXPIRES_IN="1h"
LOG_LEVEL="debug"
```

Conexao local com o PostgreSQL do Docker:

```txt
Host: localhost
Port: 5432
Database: hit_incidents
User: hit
Password: hit
Schema: public
```

Dentro do Docker Compose, a API usa o host interno `postgres`:

```txt
postgresql://hit:hit@postgres:5432/hit_incidents?schema=public
```

## Rodando Localmente

Para rodar o backend localmente usando o PostgreSQL do Docker:

```bash
npm install
npm run prisma:generate
docker compose up -d postgres
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

A API ficara disponivel em:

```txt
http://localhost:3000/api/v1
```

Swagger:

```txt
http://localhost:3000/api/docs
```

Para rodar API e PostgreSQL no Docker Compose:

```bash
docker compose --profile api up --build
```

## Prisma

Gerar Prisma Client:

```bash
npm run prisma:generate
```

Criar/aplicar migration em desenvolvimento:

```bash
npm run prisma:migrate:dev
```

Aplicar migrations existentes:

```bash
npm run prisma:migrate:deploy
```

Abrir Prisma Studio:

```bash
npm run prisma:studio
```

## Seed

O seed popula usuarios e incidentes demo para avaliacao manual:

```bash
npm run prisma:seed
```

Usuarios padrao:

```txt
Admin: admin@hit.local / Admin123!
User:  user@hit.local / User123!
```

IDs estaveis dos usuarios:

```txt
Admin: cf859f02-e83f-4b78-8f5b-6944ca5fd38a
User:  356b57c6-9b8a-4576-8df6-cbd9799d8295
```

O seed cria 16 incidentes demo:

- 14 incidentes ativos e 2 incidentes removidos logicamente.
- 4 incidentes por status: `OPEN`, `IN_PROGRESS`, `RESOLVED` e `CANCELED`.
- Prioridades distribuidas entre `LOW`, `MEDIUM`, `HIGH` e `CRITICAL`.
- Categorias distribuidas entre `SYSTEM`, `NETWORK`, `INFRASTRUCTURE`, `ACCESS`, `DATA` e `PROCESS`.
- Responsaveis alternados entre os usuarios padrao.
- Datas de criacao e resolucao espalhadas para testar filtros por periodo.
- Historico de alteracoes em parte dos incidentes, incluindo resolucoes com `status` e `resolvedAt`.

Os incidentes demo usam IDs estaveis no formato:

```txt
10000000-0000-4000-8000-000000000001
...
10000000-0000-4000-8000-000000000016
```

Esses dados sao voltados para Swagger, Insomnia e chamadas locais. A suite e2e usa schema isolado e dados proprios.

## Rotas

Todas as rotas da API usam o prefixo global:

```txt
/api/v1
```

Auth:

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Users:

```txt
GET /api/v1/users
GET /api/v1/users/:id
```

Incidents:

```txt
POST   /api/v1/incidents
GET    /api/v1/incidents
GET    /api/v1/incidents/:id
PATCH  /api/v1/incidents/:id
PATCH  /api/v1/incidents/:id/resolve
DELETE /api/v1/incidents/:id
GET    /api/v1/incidents/:id/history
```

`POST /api/v1/auth/register` e `POST /api/v1/auth/login` sao publicos. As demais rotas exigem JWT bearer token.

## Logs Estruturados

A API usa `nestjs-pino`/Pino como logger global.

- Logs HTTP sao emitidos em JSON estruturado.
- Toda resposta recebe `x-request-id`.
- Quando o cliente envia `x-request-id`, o valor e preservado.
- Quando ausente, a API gera um UUID.
- Campos sensiveis como senha, hash, token, `Authorization`, cookies e secrets sao mascarados.
- Operacoes principais de auth, users e incidents registram `operation` e IDs seguros quando disponiveis.

Nivel de log:

```env
LOG_LEVEL="debug"
```

Em testes, o logger usa `silent` por padrao para evitar ruido.

## Testes

Rodar lint:

```bash
npm run lint
```

Rodar testes unitarios:

```bash
npm test
```

Rodar build:

```bash
npm run build
```

Rodar e2e com PostgreSQL real:

```bash
docker compose up -d postgres
npm run test:e2e
```

A suite e2e exige `DATABASE_URL_TEST`. Por seguranca, a URL precisa informar um schema explicito iniciado por `e2e_`, como:

```env
DATABASE_URL_TEST="postgresql://hit:hit@localhost:5432/hit_incidents?schema=e2e_test"
```

O harness e2e falha antes de migrations ou limpeza se a URL usar `schema=public`, nao tiver schema ou usar um schema fora do prefixo `e2e_`.

## Insomnia

A collection esta em:

```txt
docs/Insomnia_2026-06-30.yaml
```

Ela usa variaveis de ambiente para:

- `BaseURL`
- `ApiVersion`
- `JWToken`
- usuarios seedados
- incidentes seedados

Fluxo sugerido:

1. Rode `npm run prisma:seed`.
2. Use a request `Auth / Login`.
3. Copie o `accessToken` retornado para a variavel `JWToken`.
4. Execute as requests protegidas.

## CI

O workflow GitHub Actions esta em:

```txt
.github/workflows/ci.yml
```

Ele roda em `push` e `pull_request`:

- `npm ci`
- `npm run prisma:generate`
- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`
- `npm run test:e2e`

O CI sobe PostgreSQL 16 como service e usa `DATABASE_URL_TEST` com `schema=e2e_ci`.

## Decisoes Importantes Do MVP

- JWT apenas com access token.
- Sem refresh token no MVP.
- Senhas com Argon2id.
- `Incident` e `User` sao aggregate roots.
- `IncidentHistory` e registro de auditoria associado ao incidente.
- IDs UUID.
- Soft delete com `deletedAt`.
- Queries padrao ignoram registros com `deletedAt`.
- Datas em UTC e expostas em ISO 8601.
- Prisma fica isolado na infraestrutura.
- Use cases nao importam Prisma, Nest HTTP, controllers ou detalhes de infraestrutura.
- Controllers sao finos e delegam para use cases.
- Atualizacao de incidente e historico sao persistidos na mesma transacao via Unit of Work.
- Historico obrigatorio nao e implementado por evento assincrono.
- `PATCH /api/v1/incidents/:id` nao aceita `status = RESOLVED`.
- Resolucao ocorre por `PATCH /api/v1/incidents/:id/resolve`.
- `DELETE /api/v1/incidents/:id` faz soft delete.
- Paginacao usa `page` default `1`, `limit` default `10` e `limit` maximo `100`.
- Ordenacao padrao da listagem de incidentes: `createdAt desc`.
- Logs estruturados com `requestId`, redaction e operacoes principais.

## Pos-MVP

Ficaram documentados como evolucao futura:

- Regras especificas por role.
- Purge/anonimizacao de soft delete antigo.
- Observabilidade avancada com OpenTelemetry, metricas, dashboards e envio para ferramenta externa.
- Migracao eventual de Jest para Vitest.
- CQRS completo com read models/projecoes, se houver necessidade.
- DDD mais profundo com bounded contexts reais, se o dominio crescer.
- Mensageria duravel/outbox.
- Refresh token, se o escopo de autenticacao evoluir.

Detalhes em [docs/08-pos-mvp.md](docs/08-pos-mvp.md).
