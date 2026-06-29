# Modelagem e API

Este documento registra a modelagem planejada para usuarios, incidentes e historico.

A modelagem segue DDD pragmatico: entidades ricas, aggregates pequenos, invariantes protegidas por metodos de dominio e persistencia isolada por repositories.

## Modelo de Dominio

### Aggregates

Aggregates aprovados:

- `Incident`: aggregate root do ciclo de vida de incidentes.
- `User`: aggregate root de usuarios autenticados e responsaveis.

Registros associados:

- `IncidentHistory`: registro de auditoria associado a `Incident`, persistido de forma atomica com alteracoes relevantes.

Diretrizes:

- Aggregates nao devem expor setters publicos livres.
- Alteracoes devem acontecer por metodos de dominio.
- Repositories devem hidratar aggregates sem vazar tipos Prisma.
- Use cases coordenam repositories, Unit of Work e event bus.

## Entidades

### User

Representa usuarios autenticados e responsaveis por incidentes.

Campos planejados:

```txt
id
name
email
passwordHash
role
createdAt
updatedAt
```

Padrao de ID:

- UUID.

Soft delete:

- `deletedAt` opcional.

Relacionamentos:

- Um usuario pode ser responsavel por varios incidentes.
- Um usuario pode aparecer como autor de varias alteracoes em historico.

### Incident

Representa um incidente operacional e atua como aggregate root do ciclo de vida do incidente.

Campos planejados:

```txt
id
title
description
category
priority
status
assigneeId
createdAt
updatedAt
resolvedAt
```

Padrao de ID:

- UUID.

Soft delete:

- `deletedAt` opcional.
- Listagens e consultas padrao devem ignorar incidentes removidos logicamente.

Relacionamentos:

- Um incidente possui um usuario responsavel.
- Um incidente possui varios registros de historico.

Metodos de dominio planejados:

```txt
updateDetails
assignTo
changePriority
changeStatus
resolve
softDelete
```

### IncidentHistory

Representa uma alteracao realizada em um incidente.

No DDD adotado, este registro nao deve comandar o ciclo de vida do incidente. Ele e um registro de auditoria persistido junto da alteracao que o originou.

Campos planejados:

```txt
id
incidentId
field
oldValue
newValue
changedById
changedAt
```

Padrao de ID:

- UUID.

Relacionamentos:

- Um historico pertence a um incidente.
- Um historico pertence ao usuario que realizou a alteracao.

## Enums

### IncidentStatus

Valores aprovados:

```ts
OPEN
IN_PROGRESS
RESOLVED
CANCELED
```

Mapeamento conceitual:

- `OPEN`: aberto.
- `IN_PROGRESS`: em andamento.
- `RESOLVED`: resolvido.
- `CANCELED`: cancelado.

### IncidentPriority

Valores aprovados:

```ts
LOW
MEDIUM
HIGH
CRITICAL
```

Mapeamento conceitual:

- `LOW`: baixa.
- `MEDIUM`: media.
- `HIGH`: alta.
- `CRITICAL`: critica.

### IncidentCategory

Valores aprovados:

```ts
SYSTEM
NETWORK
INFRASTRUCTURE
ACCESS
DATA
PROCESS
```

### UserRole

Valores aprovados:

```ts
ADMIN
USER
```

## Value Objects

Value Objects devem ser usados de forma seletiva.

Candidatos:

- `Email`.
- `IncidentTitle`.
- `IncidentDescription`.
- `PaginationParams`.

Regra:

- Criar Value Object somente quando ele proteger uma regra real, evitar duplicacao relevante ou melhorar a clareza do dominio.
- Nao criar Value Objects cerimoniais para todo campo simples.

## Eventos de Dominio

Eventos candidatos:

```txt
IncidentCreatedEvent
IncidentUpdatedEvent
IncidentResolvedEvent
IncidentSoftDeletedEvent
UserRegisteredEvent
```

Diretriz:

- Eventos podem ser publicados apos persistencia bem-sucedida.
- Eventos nao substituem transacoes obrigatorias.
- Historico RF06 nao deve depender de handler assincrono.

## Endpoints

Base path:

```txt
/api/v1
```

### Auth

Endpoints planejados:

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Observacao:

- `POST /auth/register` sera publico para facilitar a avaliacao.

### Users

Endpoints planejados:

```txt
GET /api/v1/users
GET /api/v1/users/:id
```

Objetivo:

- Permitir listar usuarios disponiveis para atribuicao de responsavel.
- Permitir consultar detalhes basicos de um responsavel.

### Incidents

Endpoints planejados:

```txt
POST   /api/v1/incidents
GET    /api/v1/incidents
GET    /api/v1/incidents/:id
PATCH  /api/v1/incidents/:id
PATCH  /api/v1/incidents/:id/resolve
DELETE /api/v1/incidents/:id
GET    /api/v1/incidents/:id/history
```

Observacao:

- `DELETE /api/v1/incidents/:id` deve executar soft delete preenchendo `deletedAt`.
- Delete fisico nao faz parte do fluxo principal.

## Filtros de Incidentes

Endpoint:

```txt
GET /api/v1/incidents
```

Query params planejados:

```txt
page
limit
status
priority
category
assigneeId
createdFrom
createdTo
resolvedFrom
resolvedTo
```

Exemplo:

```txt
/api/v1/incidents?page=1&limit=10&status=OPEN&priority=HIGH&category=SYSTEM
```

## Paginacao

Formato aprovado:

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

Regras aprovadas:

- `page` padrao: `1`.
- `limit` padrao: `10`.
- `limit` maximo: `100`.
- Ordenacao padrao: `createdAt desc`.

## Regras de Resolucao

Endpoint dedicado:

```txt
PATCH /api/v1/incidents/:id/resolve
```

Comportamento aprovado:

- Atualizar `status` para `RESOLVED`.
- Preencher `resolvedAt` automaticamente.
- Registrar historico da mudanca de status.
- Registrar historico da mudanca de data de resolucao, se a data for tratada como campo historico.
- Retornar `422` se o incidente ja estiver resolvido.
- Bloquear mudanca para `RESOLVED` no endpoint generico `PATCH /api/v1/incidents/:id`.
- Exigir o uso de `PATCH /api/v1/incidents/:id/resolve` para resolver incidentes.

## Controle de Acesso

Decisoes aprovadas:

- Apenas usuarios autenticados acessam os endpoints protegidos.
- Usuarios autenticados podem visualizar todos os incidentes.
- A listagem permite filtrar por `assigneeId` para consultar incidentes atribuidos a uma pessoa.
