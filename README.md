# HIT Communications - Incident Management API

API REST para gerenciamento de incidentes operacionais, desenvolvida como teste técnico para a HIT Communications.

O projeto implementa um monólito modular em NestJS com Clean Architecture, DDD pragmático, CQRS leve, entidades de domínio ricas, Repository Pattern, Unit of Work, Prisma isolado na infraestrutura, JWT access token e senhas com Argon2id.

## Quick Start

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar `.env`
```bash
cp .env.example .env
```

### 3. Subir a stack (Banco + API)
```bash
docker compose up -d --build
```
> Para incluir métricas e logs (Loki, Grafana, Alloy), use `docker compose --profile observability up -d --build`

### 4. Preparar o banco de dados e popular com dados de teste
```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

A API estará disponível em `http://localhost:3000/api/v1`.  
Para explorar via Swagger, acesse `http://localhost:3000/api/docs`.
> O arquivo Insomnia pode ser encontrado em `docs/Insomnia_2026-06-30.yaml`.

## Qualidade Básica

Antes de commitar, certifique-se de rodar os testes e a validação básica:

```bash
npm run lint
npm test
npm run build
```

---

## Documentação Completa

Todas as decisões técnicas, guias e detalhes profundos do projeto foram movidos para a pasta `docs/`. Consulte os arquivos abaixo de acordo com sua necessidade:

| Documento                                                                   | Conteúdo |
|-----------------------------------------------------------------------------| --- |
| [01 - Requisitos](docs/01-requisitos.md)                                    | Escopo funcional e não funcional do teste |
| [02 - Decisões e Trade-offs](docs/02-decisoes-e-tradeoffs.md)               | Decisões técnicas com foco em por que foram escolhidas |
| [03 - Arquitetura](docs/03-arquitetura.md)                                  | Organização interna, fluxo e regras de fronteira |
| [04 - Modelagem e API](docs/04-modelagem-e-api.md)                          | Entidades, enums e rotas HTTP (veja também o arquivo Insomnia) |
| [05 - Testes e Qualidade](docs/05-testes-e-qualidade.md)                    | Estratégia de testes locais, E2E com DB real e workflow do CI |
| [06 - Observabilidade e Benchmark](docs/06-observabilidade-e-benchmark.md)  | Logs estruturados (Grafana/Loki/Alloy) e performance (K6) |
| [07 - Pós-MVP](docs/07-pos-mvp.md)                                          | Evoluções e funcionalidades mapeadas mas fora do escopo inicial |
| [08 - Revisão com IA](docs/08-revisao-com-ia.md)                            | Fluxo de automação de Code Review local via IA (Codex) |