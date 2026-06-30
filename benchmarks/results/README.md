# Benchmark Results

Esta pasta recebe os summaries gerados pelo k6.

Os arquivos `*-summary.json` e `*-summary.md` sao gerados automaticamente quando os cenarios sao executados via Docker Compose.

## Template Manual

Use este template para registrar resultados consolidados:

```txt
Data:
Commit:
Sistema operacional:
CPU:
Memoria RAM:
Node.js:
PostgreSQL:
Docker:
Modo da API: Docker / local start:prod
Dataset:
Comando:
Cenario:
VUs:
Duracao:
Requests por segundo:
p50:
p90:
p95:
p99:
Taxa de erro:
Observacoes:
Conclusao:
```

Observacao:

- Benchmarks locais sao linha de base para comparacao, nao garantia de capacidade em producao.
- Recrie o seed antes de comparar execucoes.
