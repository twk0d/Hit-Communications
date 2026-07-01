# Observabilidade e Benchmark

Este documento engloba as ferramentas operacionais acopladas ao projeto: Logging, monitoramento e testes de performance de carga.

## 1. Observabilidade (Logs)

A API utiliza `nestjs-pino` para garantir logs estruturados em JSON de ponta a ponta, essenciais para debug em produção.
A stack de observabilidade local usa o conjunto LGTM (Loki, Grafana, Alloy).

### Configuração
Para rodar a aplicação localmente pelo terminal (desenvolvimento focado no código):
```env
LOG_LEVEL="debug"
LOG_FORMAT="pretty" # Ativa logs coloridos, amigáveis para leitura humana
```

Para rodar via Docker Compose, onde os logs serão coletados pelas ferramentas (simulando produção):
```env
LOG_FORMAT="json"
```

### Stack Local
Rode a stack para subir o Grafana, Loki e o Grafana Alloy (agente coletor):
```bash
docker compose --profile observability up -d --build
```
Acesse o **Grafana** em `http://localhost:3001` (Credenciais: admin/admin).
Um dashboard `HIT API Logs` já estará provisionado lendo dados do Loki automaticamente.

### Recursos Implementados:
- Injeção automática de `x-request-id` para rastrear requisições.
- Campos de senha, token JWT e Authorization são mascarados (redacted) para não vazar logs críticos.
- O campo `operation` indica o use case rodando (ex: `operation="incident.resolve"`).

**Exemplos de Queries LogQL úteis no Grafana:**
```txt
{service="api"} | json
{service="api"} | json | operation="incident.resolve"
{service="api"} | json | requestId="uuid-da-requisicao"
```

---

## 2. Benchmark (K6)

Testes de performance foram criados usando o **K6**, também incluídos via Docker Compose.

### Ambiente Fixado
Para garantir que os resultados do benchmark tenham baseline consistente de máquina para máquina, fixamos limites do Docker:
- **API**: 2 vCPUs e 4GB RAM
- **Postgres**: 2 vCPUs e 4GB RAM

> Se estiver rodando no Docker Desktop (Windows/Mac), certifique-se que seu Docker Engine global tenha pelo menos 4~6 CPUs liberadas, caso contrário, os contêineres "engasgarão".

### Executando Benchmarks

Primeiro suba a API e o DB com a rede configurada:
```bash
npm run bench:db
npm run bench:prepare  # (migrações e seed inicial)
docker compose up -d --build
```

Rode os cenários (em outro terminal):
```bash
npm run k6:smoke     # Valida se tudo funciona com carga irrisória
npm run k6:baseline  # Carga média esperada em produção normal
npm run k6:load      # Carga pesada
npm run k6:stress    # Força a API ao limite (Ramping VUs) para ver onde quebra
```

Todos os resultados HTML gerados pelas execuções cairão automaticamente na pasta `benchmarks/results/`.
