# HIT Communications - Teste Tecnico TypeScript

API REST para gerenciamento de incidentes operacionais, desenvolvida como teste tecnico para a HIT Communications.

O projeto adota Clean Architecture orientada a DDD pragmatico: entidades ricas, aggregates bem delimitados, use cases explicitos, Repository Pattern, Unit of Work, CQRS leve e eventos de dominio em memoria quando fizerem sentido.

Este repositorio ainda esta na fase de alinhamento tecnico. As decisoes, requisitos e plano de implementacao estao documentados em:

- [docs/01-requisitos-do-teste.md](docs/01-requisitos-do-teste.md)
- [docs/02-decisoes-tecnicas.md](docs/02-decisoes-tecnicas.md)
- [docs/03-modelagem-e-api.md](docs/03-modelagem-e-api.md)
- [docs/04-validacao-erros-e-historico.md](docs/04-validacao-erros-e-historico.md)
- [docs/05-plano-de-testes.md](docs/05-plano-de-testes.md)
- [docs/06-revisao-local-codex.md](docs/06-revisao-local-codex.md)
- [docs/07-arquitetura-detalhada.md](docs/07-arquitetura-detalhada.md)
- [docs/08-pos-mvp.md](docs/08-pos-mvp.md)

## Desenvolvimento Local

### Requisitos

- Node.js 24 LTS.
- npm.
- Docker Desktop.

### Configuracao

Para rodar o backend localmente usando o PostgreSQL do Docker:

```bash
cp .env.example .env
npm install
npm run prisma:generate
docker compose up -d postgres
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Para rodar backend e PostgreSQL dentro do Docker Compose:

```bash
docker compose --profile api up --build
```

A API usa o prefixo global `/api/v1`.

A documentacao Swagger ficara disponivel em:

```txt
http://localhost:3000/api/docs
```

### Dados de Seed

O comando abaixo popula dados de desenvolvimento para avaliacao manual:

```bash
npm run prisma:seed
```

Usuarios padrao:

```txt
Admin: admin@hit.local / Admin123!
User:  user@hit.local / User123!
```

O seed tambem cria 16 incidentes demo:

- 14 incidentes ativos e 2 incidentes removidos logicamente.
- 4 incidentes por status: `OPEN`, `IN_PROGRESS`, `RESOLVED` e `CANCELED`.
- Prioridades distribuidas entre `LOW`, `MEDIUM`, `HIGH` e `CRITICAL`.
- Categorias distribuidas entre `SYSTEM`, `NETWORK`, `INFRASTRUCTURE`, `ACCESS`, `DATA` e `PROCESS`.
- Responsaveis alternados entre os usuarios padrao.
- Datas de criacao e resolucao espalhadas para testar filtros por periodo.
- Historico de alteracoes em parte dos incidentes, incluindo resolucoes com `status` e `resolvedAt`.

Esses dados sao voltados para uso manual em Swagger, Insomnia ou chamadas locais. A suite e2e deve usar banco de teste isolado e dados proprios.

### Scripts Principais

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```
