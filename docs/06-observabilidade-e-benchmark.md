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

O teto operacional observado para esta configuração local foi definido em `K6_MAX_VUS=425`. Os cenários respeitam esse limite mesmo quando uma variável de VUs é configurada acima dele.

### Executando Benchmarks

Primeiro suba a API e o DB com a rede configurada:
```bash
npm run bench:db
npm run bench:prepare  # (migrações e seed inicial)
npm run bench:stack
```

Rode os cenários (em outro terminal):

| Comando | Objetivo | Quando usar |
| --- | --- | --- |
| `npm run k6:smoke` | Valida rapidamente se login, listagem, filtros, detalhe, histórico, criação e resolução respondem com carga mínima. | Antes dos cenários maiores ou depois de subir a stack. |
| `npm run k6:baseline` | Mede uma carga média esperada em uso normal, com predominância de leitura e poucas escritas. Default: 100 VUs. | Para criar um ponto de comparação saudável de latência, erros e throughput. |
| `npm run k6:load` | Aplica carga alta planejada com rampa de subida, sustentação e rampa de descida. Default: 275 VUs. | Para avaliar se a API aguenta volume maior sem degradação relevante. |
| `npm run k6:stress` | Aumenta progressivamente os usuários virtuais em degraus de 100, 200, 325 e 425 VUs. | Para descobrir gargalos sem ultrapassar o teto operacional conhecido. |
| `npm run k6:spike` | Injeta um pico brusco e curto de tráfego até 425 VUs. | Para simular rajadas repentinas de uso e observar recuperação. |
| `npm run k6:soak` | Mantém carga moderada por mais tempo. Default: 125 VUs. | Para encontrar degradação lenta, vazamento de memória ou acúmulo de conexões. |

Ordem sugerida para uma bateria completa:
```bash
npm run k6:smoke
npm run k6:baseline
npm run k6:load
npm run k6:stress
npm run k6:spike
npm run k6:soak
```

Todos os resultados gerados pelas execuções cairão automaticamente na pasta `benchmarks/results/`.

A análise consolidada dos resultados atuais está documentada em `docs/09-relatorio-performance-k6.md`.
