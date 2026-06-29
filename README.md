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

### Scripts Principais

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```
