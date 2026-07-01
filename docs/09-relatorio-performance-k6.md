# Relatório de Performance K6

Este documento consolida os resultados dos cenários de benchmark executados com k6 e registra uma análise crítica dos sinais observados durante os testes locais.

Os dados abaixo foram extraídos dos relatórios em `benchmarks/results/`, gerados em 2026-07-01 UTC. O ambiente usado foi a stack local Docker Compose descrita em `docs/06-observabilidade-e-benchmark.md`, com API e Postgres limitados a 2 vCPUs e 4 GB de RAM cada.

## 1. Contexto Operacional

Durante os testes, o gargalo observado foi CPU. A memória dos contêineres permaneceu folgada, sem passar de aproximadamente 1.3 GB, enquanto CPU atingiu o teto disponível nos cenários de maior pressão.

Isso muda a leitura dos resultados:

- aumentar RAM, isoladamente, tende a não melhorar a capacidade atual;
- o limite prático está em processamento, concorrência, banco, serialização, logs ou overhead do runtime;
- o teto operacional local foi calibrado para `K6_MAX_VUS=425`, pois acima de ~450 VUs a CPU chegou a 100%;
- `425 VUs` deve ser tratado como limite de teste, não como alvo confortável de operação contínua.

## 2. Resumo dos Resultados

| Cenário | VUs máx | Duração | Requests | Req/s | Falhas | Checks | Latência média | p90 | p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| smoke | 1 | 30.7s | 183 | 5.96 | 0.00% | 100.00% | 25.43 ms | 57.59 ms | 64.48 ms |
| baseline | 100 | 61.1s | 5,913 | 96.72 | 0.00% | 100.00% | 22.00 ms | 33.97 ms | 53.59 ms |
| load | 275 | 180.7s | 43,331 | 239.75 | 0.00% | 100.00% | 61.42 ms | 113.04 ms | 198.71 ms |
| stress | 425 | 270.8s | 44,136 | 163.01 | 0.00% | 100.00% | 325.98 ms | 872.98 ms | 992.53 ms |
| spike | 425 | 120.6s | 12,219 | 101.33 | 0.00% | 100.00% | 312.36 ms | 885.89 ms | 1,021.28 ms |
| soak | 125 | 601.1s | 73,708 | 122.62 | 0.00% | 100.00% | 17.42 ms | 26.74 ms | 34.10 ms |

## 3. Leitura por Cenário

### Smoke
O `smoke` validou a sanidade funcional da API com baixa carga. O resultado é saudável: 0% de falhas, checks em 100% e p95 abaixo de 65 ms.

Esse cenário confirma que a stack estava funcional antes dos testes maiores, mas não deve ser usado para inferir capacidade.

### Baseline
O `baseline` rodou com 100 VUs e manteve p95 em 53.59 ms. Este é o melhor ponto de referência para uso normal: a API respondeu com baixa latência e sem falhas.

O comportamento indica que, em carga cotidiana, a arquitetura atual tem boa margem.

### Load
O `load` chegou a 275 VUs e produziu o maior throughput observado: 239.75 req/s, com p95 de 198.71 ms e 0% de falhas.

Este é o melhor ponto operacional encontrado nos relatórios: a API ainda sustenta boa vazão e latência controlada. Para esta máquina e esta configuração Docker, 275 VUs parece ser uma região de carga alta porém ainda saudável.

### Stress
O `stress` chegou a 425 VUs. Mesmo sem falhas funcionais, a latência aumentou fortemente: p95 de 992.53 ms.

O dado mais importante é que aumentar de 275 para 425 VUs não aumentou a vazão. Pelo contrário: o throughput caiu de 239.75 req/s para 163.01 req/s, enquanto a latência p95 subiu quase 5x. Isso é um sinal clássico de saturação: o sistema passa a formar fila em algum recurso, e mais concorrência apenas aumenta espera.

### Spike
O `spike` também chegou a 425 VUs e teve p95 de 1,021.28 ms. O resultado funcional continuou correto, mas a latência de cauda ultrapassou 1 segundo.

Esse cenário mostra que a API absorve rajadas sem erro, mas com degradação perceptível. Em produção, isso exigiria autoscaling, fila, cache, circuit breaker ou controle de concorrência antes do pico chegar nesse nível.

### Soak
O `soak` rodou por cerca de 10 minutos com 125 VUs e manteve p95 de 34.10 ms, sem falhas.

Esse é um sinal positivo: não apareceu degradação progressiva relevante no tempo de execução observado. Como o teste não capturou métricas históricas de CPU/memória por contêiner no relatório, ainda não dá para descartar vazamentos em janelas mais longas, mas os resultados disponíveis não apontam problema de estabilidade em 10 minutos.

## 4. Análise Crítica

Os resultados indicam que o limite atual não é corretude, memória ou falha funcional. Todos os cenários registraram 0% de falhas e 100% de checks. O limite é desempenho sob saturação de CPU.

O ponto de inflexão aparece entre `load` e `stress`:

- `load`: 275 VUs, 239.75 req/s, p95 198.71 ms;
- `stress`: 425 VUs, 163.01 req/s, p95 992.53 ms.

Esse comportamento sugere que o sistema entra em regime de fila. Depois de certo ponto, adicionar VUs aumenta o trabalho pendente, mas não aumenta a capacidade de processar requisições. A queda de throughput no `stress` reforça que o gargalo não é simplesmente "mais usuários", mas contenção em recurso limitado.

Como a RAM ficou abaixo de ~1.3 GB, não há sinal de pressão de memória. A hipótese principal é CPU-bound. A CPU está majoritariamente saturada na API e no Postgres.

Também é relevante notar que VU não equivale diretamente a usuário real. Cada VU executa iterações com `K6_THINK_TIME_SECONDS=1` e um mix específico de operações. Por isso, os indicadores mais úteis para capacidade são `req/s`, p95/p99 e saturação de CPU por serviço.

## 5. Recomendações de Otimização

### 5.1. Cache em memória/Redis
Cache é uma boa evolução, especialmente porque parte relevante dos cenários é leitura (`GET /incidents`, filtros, detalhes e histórico).

Sugestões:

- Redis para cache compartilhado entre réplicas;
- TTL curto para listagens e filtros comuns;
- cache de `GET /users`, pois tende a mudar pouco e alimenta seletores de responsável;
- cache de incidentes por ID para leituras repetidas;
- invalidação em escrita: criar, atualizar, resolver ou deletar incidente deve invalidar chaves relacionadas.

O ganho esperado é reduzir CPU e I/O do Postgres em rotas repetitivas de leitura. Porém cache não resolve custo de escrita, transações com histórico, serialização JSON, logs excessivos ou CPU da própria API. Ele deve ser tratado como uma otimização seletiva, não como solução única.

### 5.2. Escala vertical e depois horizontal
Como o gargalo observado foi CPU e a memória ficou folgada, a primeira evolução pragmática é escala vertical: aumentar a quantidade de vCPUs disponíveis para a API e/ou Postgres antes de introduzir complexidade de distribuição.

Próximos passos:

- repetir `load`, `stress` e `spike` com limites maiores de CPU para API e Postgres;
- identificar se a saturação fica concentrada no contêiner da API, no Postgres ou no overhead do Docker Desktop;
- ajustar `K6_MAX_VUS` somente depois de medir novo ponto de saturação;
- manter memória observada como métrica secundária, já que ela não foi o gargalo nos testes atuais.

Se a escala vertical melhorar latência e throughput, ela é o caminho mais simples para este estágio do projeto. Quando o aumento de vCPU deixar de trazer ganho proporcional, aí a próxima etapa passa a ser escala horizontal.

Na escala horizontal, a API pode rodar múltiplas instâncias atrás de um balanceador:

- múltiplas réplicas Docker/Kubernetes;
- Node cluster/PM2 em ambiente simples;
- autoscaling baseado em CPU e latência p95.

Como o projeto já é stateless no HTTP e usa JWT access token, a API é relativamente amigável para escala horizontal. Cache compartilhado via Redis ajudaria a manter consistência entre réplicas.

### 5.3. Banco de dados e queries
O schema já possui índices relevantes para filtros (`status`, `priority`, `category`, `assigneeId`, datas e `deletedAt`). Mesmo assim, a listagem com múltiplos filtros e paginação pode ficar cara conforme o volume cresce.

Próximos passos:

- rodar `EXPLAIN ANALYZE` nas queries mais frequentes;
- avaliar índices compostos alinhados aos filtros reais;
- reduzir payloads retornados quando a listagem não precisa de todos os campos;
- avaliar paginação por cursor para grandes volumes;
- monitorar custo de `count(*)` nas listagens paginadas.

### 5.4. Logs e serialização
Logs estruturados são importantes, mas em alta carga podem consumir CPU, principalmente com JSON, redaction e stdout em Docker.

Sugestões:

- manter logs essenciais, mas revisar verbosidade em cenários de benchmark;
- evitar logar payloads grandes;
- avaliar sampling para operações muito frequentes;
- medir impacto de `LOG_LEVEL` e `LOG_FORMAT=json` no throughput.

### 5.5. Pool de conexões e Prisma
Sob carga alta, o Prisma e o Postgres podem sofrer por excesso ou falta de conexões.

Próximos passos:

- monitorar quantidade de conexões durante `load`, `stress` e `spike`;
- ajustar pool/concurrency conforme ambiente;
- considerar PgBouncer se o número de réplicas crescer;
- medir custo das transações de update/resolve com histórico.

## 6. Capacidade Recomendada

Para esta configuração local, a faixa mais saudável observada foi:

- carga normal: até 100 VUs (`baseline`);
- carga alta sustentável: em torno de 275 VUs (`load`);
- limite de teste: 425 VUs (`stress`/`spike`);
- evitar operar continuamente no limite de 425 VUs.

Se fosse definir uma política operacional conservadora a partir destes dados, eu usaria:

- alerta quando CPU passar de 70% por janela sustentada;
- alerta quando p95 passar de 500 ms;
- ação de escala antes de chegar a 425 VUs equivalentes;
- benchmark comparativo sempre que cache, índices ou escala horizontal forem introduzidos.
