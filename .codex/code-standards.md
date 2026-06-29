# Padroes de Codigo e Arquitetura

Este arquivo deve ser usado como contexto em revisoes locais com Codex.

## Objetivo da Revisao

Verificar se as alteracoes cumprem:

- Requisitos do teste tecnico da HIT Communications.
- Decisoes arquiteturais documentadas em `docs/`.
- Clean Architecture.
- DDD pragmatico.
- Baixo acoplamento.
- Alta coesao.
- Legibilidade.
- Cobertura de testes proporcional ao risco.

## Stack Esperada

- NestJS.
- TypeScript.
- npm.
- Prisma ORM.
- PostgreSQL.
- Zod.
- Jest.
- Swagger/OpenAPI.
- JWT.
- Docker e Docker Compose.
- `@nestjs/cqrs`.
- Argon2id para hash de senhas.

## Arquitetura Obrigatoria

- Clean Architecture orientada a DDD pragmatico.
- Modulos hibridos.
- Feature modules para dominio.
- Camadas globais em `shared/` e `infra/`.
- CQRS leve, separando commands e queries.
- Um use case por operacao.
- Use cases concentrando regras de negocio.
- Controllers finos, responsaveis por HTTP e chamada dos use cases.
- Repository Pattern com interface no dominio/core e implementacao Prisma na infraestrutura.
- Unit of Work para transacoes.
- Entidades de dominio ricas, com estado privado e alteracoes por metodos.
- Aggregates pequenos e explicitos.
- Value Objects seletivos.
- Domain Events em memoria apenas quando agregarem clareza.

## DDD Pragmatico

Regras:

- `Incident` e aggregate root.
- `User` e aggregate root.
- `IncidentHistory` e registro de auditoria associado ao incidente.
- Aggregates protegem invariantes.
- Alteracoes de estado acontecem por metodos de dominio.
- Value Objects so devem ser criados quando houver regra real ou ganho claro.
- Domain Events nao substituem transacoes, invariantes ou historico obrigatorio.
- Use cases orquestram fluxo, repositorios, Unit of Work e event bus.
- Domain Services devem ser evitados no MVP, salvo necessidade concreta.

## Regras de Dependencia

Permitido:

- Controller chama use case.
- Use case depende de interfaces de repositorio.
- Infraestrutura implementa interfaces de repositorio usando Prisma.
- Schemas Zod validam entradas nas bordas da aplicacao.
- Operacoes de escrita passam por commands/use cases.
- Operacoes de leitura passam por queries/use cases.
- Aggregates nao conhecem Prisma, Nest, controllers, DTOs ou schemas Zod.

Proibido:

- Use case importar Prisma, Prisma Client, modelos Prisma ou detalhes de banco.
- Domain/core importar Nest decorators, HTTP request/response, guards, interceptors ou controllers.
- Controller implementar regra de negocio.
- Infraestrutura vazar tipos Prisma para o dominio.
- DTO/schema de transporte virar entidade de dominio.
- Regras de negocio ficarem presas em validators.
- Aggregate expor setters publicos livres.
- Criar Value Objects sem regra ou ganho claro.
- Criar Domain Services para simples coordenacao de aplicacao.
- Historico RF06 depender de evento assincrono.
- Evento em memoria substituir transacao obrigatoria.

## Regras de API

- Todas as rotas devem estar sob `/api/v1`.
- A API deve usar REST + JSON.
- Entradas invalidas devem retornar `422` no formato aprovado.
- Recursos inexistentes devem retornar `404`.
- Erros internos devem retornar `500` sem expor detalhes tecnicos.
- Rotas protegidas exigem JWT, exceto:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- JWT usa somente access token no MVP.
- Refresh token nao faz parte do MVP.
- Senhas devem ser protegidas com Argon2id.

## Regras de Dominio

- IDs devem ser UUID.
- `responsavel` deve ser modelado como `User`.
- `Incident.assigneeId` aponta para o usuario responsavel.
- Todos os usuarios autenticados podem listar todos os incidentes.
- A listagem deve permitir filtro por `assigneeId`.
- Entidades removiveis usam soft delete com `deletedAt`.
- Consultas padrao ignoram registros com `deletedAt` preenchido.
- Datas devem ser armazenadas em UTC e expostas em ISO 8601.

## Enums

`IncidentStatus`:

```txt
OPEN
IN_PROGRESS
RESOLVED
CANCELED
```

`IncidentPriority`:

```txt
LOW
MEDIUM
HIGH
CRITICAL
```

`IncidentCategory`:

```txt
SYSTEM
NETWORK
INFRASTRUCTURE
ACCESS
DATA
PROCESS
```

`UserRole`:

```txt
ADMIN
USER
```

## Regras de Incidente

- Criacao de incidente deve receber `title`, `description`, `category`, `priority` e `assigneeId`.
- Status inicial aprovado: `OPEN`.
- Listagem deve ter paginacao.
- Paginacao usa `page` padrao `1`, `limit` padrao `10` e `limit` maximo `100`.
- Ordenacao padrao: `createdAt desc`.
- Listagem deve permitir filtros combinados por status, prioridade, categoria, responsavel, data de criacao e data de resolucao.
- Atualizacao generica pode alterar campos permitidos, mas nao pode resolver incidente.
- `PATCH /api/v1/incidents/:id` nao pode aceitar `status = RESOLVED`.
- Resolucao deve acontecer por `PATCH /api/v1/incidents/:id/resolve`.
- Resolucao deve preencher `resolvedAt` automaticamente.
- Tentar resolver incidente ja resolvido deve retornar `422`.
- `DELETE /api/v1/incidents/:id` deve executar soft delete.
- Delete fisico de incidente nao faz parte do fluxo principal.

## Historico RF06

Historico deve registrar:

- `incidentId`.
- `field`.
- `oldValue`.
- `newValue`.
- `changedById`.
- `changedAt`.

Regra obrigatoria:

- Atualizacao de incidente e registros de historico devem ser persistidos na mesma transacao Prisma.
- A transacao deve ser coordenada por Unit of Work.

Implementacao esperada:

- Use case de atualizacao encapsula `diffAndRecord()`.
- Comparar estado anterior e novo estado campo a campo.
- Criar historico apenas para campos realmente alterados.
- Nao usar event handler assincrono para criar historico obrigatorio.

## Validacao

- Usar Zod.
- Usar `ZodValidationPipe` global.
- Validar campos obrigatorios.
- Validar tamanhos minimo e maximo.
- Validar enums.
- Validar UUIDs.
- Validar datas.

Formato aprovado para erro `422`:

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## Testes Esperados

Revisar se a mudanca exige testes para:

- Criacao valida de incidente.
- Criacao invalida de incidente.
- Atualizacao de status e demais campos.
- Bloqueio de `RESOLVED` no patch generico.
- Resolucao com `resolvedAt` automatico.
- Tentativa de resolver incidente ja resolvido.
- Filtros combinados.
- Paginacao e limite maximo.
- Soft delete.
- Historico de alteracoes.
- Autenticacao JWT.
- Validacao Zod.

## Criterios de Reprovacao

Uma revisao deve pedir alteracoes se encontrar:

- Violacao de dependencia entre camadas.
- Violacao de aggregate boundaries.
- Regra de negocio fora de use case.
- Use case acoplado ao Prisma.
- Entidade anemica quando houver regra de dominio clara.
- Repository Pattern bypassado.
- Historico fora da mesma transacao da atualizacao.
- Historico obrigatorio implementado por evento assincrono.
- Endpoint sem versionamento.
- Endpoint protegido sem JWT.
- Hash de senha diferente de Argon2id.
- Refresh token implementado no MVP sem atualizacao previa da documentacao.
- Validacao incompleta ou formato de erro incorreto.
- Testes ausentes para comportamento novo ou alterado.
- Exposicao de segredo, token, senha, stack trace ou detalhe interno.
- Refatoracao ampla sem relacao com a tarefa.
