# Benchmark Results

Esta pasta recebe os summaries gerados pelo k6.

Os arquivos `*-summary.json` e `*-summary.md` sao gerados automaticamente quando os cenarios sao executados via Docker Compose.

## Ambiente Padrao

Os benchmarks locais devem registrar o ambiente usado para comparacao.

Limites definidos no `docker-compose.yml`:

```txt
API container: 2.0 CPUs, 4 GB RAM
PostgreSQL container: 2.0 CPUs, 4 GB RAM
k6 container: sem limite dedicado
```

O limite do PostgreSQL usa como referencia uma classe medium comum na AWS, com 2 vCPU e 4 GiB de memoria.

Observacao:

- Benchmarks locais sao linha de base para comparacao, nao garantia de capacidade em producao.
- Recrie o seed antes de comparar execucoes.
