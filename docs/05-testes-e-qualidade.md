# Testes e Qualidade

A estratégia de testes visa equilibrar velocidade de execução com confiança na integração real com o banco de dados.

## 1. Testes Unitários

- Focados na **Camada de Domínio** e **Camada de Aplicação (Use Cases)**.
- O Prisma/Banco de dados é sempre mockado. Isso garante que os testes rodem em milissegundos.
- **Cobertura essencial:** As lógicas complexas, transições de status do `Incident` e validações de negócio estão cobertas por unit tests.

Rodar testes unitários:
```bash
npm test
```

## 2. Testes de Integração (Infra)

- Testam especificamente os Repositories e Mappers.
- Ajudam a confirmar se as queries do Prisma estão convertendo dados do banco para Entidades de Domínio corretamente, mas sem testar o ciclo de vida HTTP.

## 3. Testes E2E (End-to-End)

Os testes E2E validam a jornada completa (Controller → Use Case → Repository → Database).

**Importante:** Os testes E2E rodam contra um PostgreSQL real, não usamos in-memory (ex: SQLite) para não mascarar comportamentos específicos do Postgres (como UUIDs reais e isolamento de transações).

Para rodar localmente:
```bash
docker compose up -d postgres
npm run test:e2e
```

### Proteção de Schema nos E2E
Por segurança, a variável `DATABASE_URL_TEST` deve usar um schema explícito iniciado pelo prefixo `e2e_`:

```env
DATABASE_URL_TEST="postgresql://hit:hit@localhost:5432/hit_incidents?schema=e2e_test"
```

O harness do E2E falha intencionalmente antes de rodar as migrations ou a limpeza de tabelas se a URL usar `schema=public` ou não possuir schema válido, evitando destruir o banco de dados principal de desenvolvimento local acidentalmente.

---

## CI/CD (GitHub Actions)

O pipeline roda a cada `push` e `pull_request`, e reflete os passos de qualidade local, porém automatizados:

1. Instala dependências (`npm ci`).
2. Gera o Prisma Client (`npm run prisma:generate`).
3. Checa a formatação/qualidade estática (`npm run lint`).
4. Roda os unit tests (`npm test -- --runInBand`).
5. Realiza o build (`npm run build`).
6. Sob um serviço PostgreSQL provisionado dinamicamente pela Action, roda o `npm run test:e2e`.
