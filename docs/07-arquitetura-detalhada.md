# Arquitetura Detalhada

Este documento registra decisoes adicionais de arquitetura, design e system design para orientar a implementacao.

O estilo arquitetural adotado e Clean Architecture orientada a DDD pragmatico.

## DDD Pragmatico

Decisao aprovada:

- Usar DDD como guia de modelagem do dominio.
- Aplicar DDD de forma pragmatica, sem cerimonia desnecessaria.

Objetivo:

- Proteger regras de negocio no dominio.
- Tornar o ciclo de vida do incidente explicito.
- Evitar controllers ou infraestrutura contendo regras centrais.
- Manter o projeto facil de entender dentro do escopo de um teste tecnico.

Praticas adotadas:

- Entidades ricas.
- Aggregates pequenos.
- Value Objects seletivos.
- Repository interfaces no dominio/application.
- Domain Events em memoria.
- Domain/Application Errors.
- Use cases como camada de aplicacao.

Fora do MVP:

- Event sourcing.
- Read models separados.
- Sagas/process managers.
- Bounded contexts artificiais.
- Factories e domain services sem necessidade concreta.

## Estrutura de Pastas

Decisao aprovada:

- Usar estrutura feature-first.
- Cada modulo de dominio concentra suas camadas internas.
- `shared/` e `infra/` ficam reservados para componentes globais.

Estrutura planejada:

```txt
src/
  modules/
    auth/
    users/
    incidents/
      domain/
        entities/
        value-objects/
        events/
        errors/
        repositories/
      application/
        commands/
        queries/
        use-cases/
      infra/
      presentation/
  shared/
  infra/
    prisma/
```

## CQRS Leve

Decisao aprovada:

- Trabalhar com CQRS.
- Usar `@nestjs/cqrs`.
- Separar operacoes de escrita em commands.
- Separar operacoes de leitura em queries.
- Manter um use case por operacao.

Escopo do MVP:

- CQRS organiza handlers e responsabilidades.
- Nao havera read model separado.
- Nao havera banco separado para leitura.
- Nao havera event sourcing.

Use cases/handlers planejados:

```txt
RegisterUserUseCase
LoginUseCase
GetMeUseCase
ListUsersUseCase
CreateIncidentUseCase
GetIncidentByIdUseCase
ListIncidentsUseCase
UpdateIncidentUseCase
ResolveIncidentUseCase
GetIncidentHistoryUseCase
```

## Eventos de Dominio em Memoria

Decisao aprovada:

- Usar event bus em memoria para eventos de dominio.
- Operacoes que exigem consistencia imediata devem ser sincronas.

Diretriz:

- Eventos em memoria podem acionar efeitos colaterais simples.
- Eventos em memoria nao devem substituir transacoes obrigatorias.
- Historico RF06 nao deve depender de handler assincrono.
- Atualizacao de incidente e historico devem continuar atomicos na mesma Unit of Work.
- Eventos de dominio nao devem ser usados como substitutos de invariantes do aggregate.

Eventos candidatos:

```txt
IncidentCreatedEvent
IncidentUpdatedEvent
IncidentResolvedEvent
IncidentSoftDeletedEvent
UserRegisteredEvent
```

Uso recomendado no MVP:

- Publicar eventos depois que a operacao principal for validada e persistida.
- Manter efeitos criticos dentro do use case quando houver necessidade de atomicidade.

## Entidades de Dominio Ricas

Decisao aprovada:

- Entidades de dominio devem ter estado privado.
- Alteracoes devem acontecer por metodos de dominio.
- Evitar setters publicos livres.
- `Incident` e `User` sao aggregate roots.

### Aggregate `Incident`

Responsabilidades:

- Controlar ciclo de vida do incidente.
- Proteger transicoes de status.
- Aplicar regra de resolucao.
- Aplicar soft delete.
- Expor dados de forma controlada para persistencia e apresentacao.

Exemplo conceitual:

```ts
incident.updateDetails({ title, description });
incident.assignTo(userId);
incident.changePriority(priority);
incident.changeStatus(status);
incident.resolve(now);
incident.softDelete(now);
```

### Aggregate `User`

Responsabilidades:

- Representar usuario autenticado.
- Proteger email, senha hash e role.
- Servir como responsavel atribuivel a incidentes.

### Registro `IncidentHistory`

`IncidentHistory` e um registro de auditoria associado ao aggregate `Incident`.

Diretriz:

- Nao deve comandar o ciclo de vida do incidente.
- Deve ser persistido de forma atomica com a alteracao que o originou.
- Deve registrar `changedById`.

Diretriz:

- Entidade protege invariantes.
- Use case orquestra fluxo, dependencias e persistencia.
- Repositories hidratam entidades a partir do banco sem expor Prisma ao dominio.

## Value Objects

Decisao aprovada:

- Usar Value Objects de forma seletiva.

Candidatos:

```txt
Email
IncidentTitle
IncidentDescription
PaginationParams
```

Quando criar:

- Quando houver validacao ou regra reutilizada.
- Quando o conceito tiver significado de dominio.
- Quando evitar duplicacao relevante.

Quando nao criar:

- Para todo campo simples sem comportamento.
- Quando so aumentar boilerplate.
- Quando o schema Zod ja resolver apenas formato de entrada sem regra de dominio.

## Domain Services

Decisao aprovada:

- Evitar Domain Services no MVP, exceto se uma regra real nao pertencer naturalmente a uma entidade ou Value Object.

Diretriz:

- Primeiro tentar colocar a regra no aggregate correto.
- Depois avaliar se o use case consegue orquestrar sem contaminar o dominio.
- Criar Domain Service apenas quando houver regra de dominio que envolva multiplos aggregates e nao seja apenas coordenacao de aplicacao.

## Unit of Work

Decisao aprovada:

- Usar Unit of Work para coordenar transacoes.

Motivacao:

- Preservar Clean Architecture.
- Evitar Prisma dentro de use cases.
- Garantir atomicidade em fluxos como atualizacao + historico.

Regra:

- Use cases dependem de uma abstracao de Unit of Work.
- Implementacao Prisma fica na infraestrutura.

## Erros de Aplicacao

Decisao aprovada:

- Usar erros proprios da aplicacao/dominio.
- Nao lancar excecoes HTTP do Nest diretamente em use cases.

Erros planejados:

```txt
ResourceNotFoundError
ValidationError
BusinessRuleViolationError
UnauthorizedError
ConflictError
```

Mapeamento:

- Filtro global do Nest converte erros da aplicacao para HTTP.
- `ResourceNotFoundError` -> `404`.
- `ValidationError` -> `422`.
- `BusinessRuleViolationError` -> `422`.
- `UnauthorizedError` -> `401`.
- `ConflictError` -> `409`.

## Linguagem Ubiqua

Decisao aprovada:

- Usar nomes de dominio consistentes nos documentos, codigo e API.

Termos principais:

- `Incident`: incidente operacional.
- `Assignee`: responsavel pelo incidente.
- `IncidentHistory`: historico de alteracoes.
- `Resolve`: resolver incidente.
- `SoftDelete`: remocao logica.
- `Priority`: prioridade.
- `Category`: categoria.

Observacao:

- A API pode usar nomes em ingles para consistencia tecnica.
- O README e documentos podem explicar o mapeamento para portugues quando necessario.

## Padrao de Resposta

Decisao aprovada:

- Recursos unicos retornam objeto direto.
- Listas paginadas retornam envelope com `data` e `meta`.

Exemplo:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Observacao:

- NestJS e Prisma nao fornecem um sistema completo de paginacao pronto para esse contrato.
- Prisma fornece os blocos `skip`, `take`, `count` e `orderBy`.
- A aplicacao deve criar um helper/DTO simples para padronizar `page`, `limit`, `total` e `totalPages`.

## Autorizacao

Decisao aprovada:

- Usar roles `ADMIN` e `USER`.
- `register` e `login` sao publicos.
- Demais endpoints protegidos exigem JWT.
- Usar somente access token no MVP.
- Nao implementar refresh token no MVP.
- Usar Argon2id para hash de senhas.
- No MVP, `ADMIN` e `USER` nao terao diferenca pratica de permissao para incidentes.
- Todos os usuarios autenticados podem listar todos os incidentes.
- A listagem deve permitir filtro por `assigneeId`.

## Soft Delete

Decisao aprovada:

- Trabalhar com soft delete.
- Entidades removiveis possuem `deletedAt`.
- Consultas padrao ignoram registros com `deletedAt` preenchido.

Diretriz:

- Nao criar delete fisico para incidentes no fluxo principal.
- Criar `DELETE /api/v1/incidents/:id` para soft delete de incidente.
- Preparar `deletedAt` em `User`, mas nao expor delete de usuario no MVP.

## Datas e Timezone

Decisao aprovada:

- Armazenar datas em UTC.
- Receber e retornar datas em ISO 8601.

## Observabilidade

Decisao aprovada:

- Logs estruturados ficam para pos-MVP.
- No MVP, priorizar entrega dos requisitos obrigatorios, testes e documentacao.

## Swagger/OpenAPI

Decisao aprovada:

- Criar documentacao Swagger com exemplos completos.

Endpoints que devem ter exemplos:

- Criacao de usuario.
- Login.
- Criacao de incidente.
- Listagem com filtros.
- Consulta por ID.
- Atualizacao.
- Resolucao.
- Historico.

## Seeds

Decisao aprovada:

- Criar seed com usuarios de exemplo.

Sugestao:

```txt
admin@hit.local / Admin123!
user@hit.local / User123!
```

## Package Manager

Decisao aprovada:

- Usar npm.

## Ordem de Commits

Decisao aprovada:

- Primeiro commit real deve enviar as documentacoes e artefatos de IA.
- Scaffold NestJS e codigo da aplicacao entram em commits posteriores.

## Testes

Decisao aprovada:

- Unit tests fortes para use cases.
- Alguns testes e2e com PostgreSQL real para auth/incidents.

Diretriz:

- E2E nao precisa cobrir todas as combinacoes.
- Unit tests devem cobrir regras de negocio principais.

## Paginacao

Decisao aprovada:

- `page` padrao: `1`.
- `limit` padrao: `10`.
- `limit` maximo: `100`.

## Ordenacao

Decisao aprovada:

- Ordenacao padrao por `createdAt desc`.
- Nao expor sort customizado no MVP, salvo necessidade durante implementacao.

## Collection Insomnia

Decisao aprovada:

- Entregar collection Insomnia como diferencial.
