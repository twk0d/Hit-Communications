# Modelagem e API

Este documento consolida o dicionário de dados (entidades e enums) e o contrato HTTP exposto pela aplicação. As rotas completas com exemplos de Payload e Resposta podem ser testadas interativamente no Swagger local (`http://localhost:3000/api/docs`).

## Entidades de Domínio

### `User`
Representa os usuários autenticados, que podem ser atribuídos como responsáveis por incidentes.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID | Identificador único |
| `name` | string | Nome completo |
| `email` | string | Email (único) |
| `passwordHash` | string | Hash gerado via Argon2id |
| `role` | `UserRole` | Perfil de acesso (`ADMIN` ou `USER`) |
| `createdAt` | DateTime | Criação (UTC) |
| `updatedAt` | DateTime | Última modificação (UTC) |
| `deletedAt` | DateTime \| null | Flag de soft delete |

### `Incident`
Aggregate Root principal. Controla as regras do ciclo de vida de um incidente operacional.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID | Identificador único |
| `title` | string | Resumo do problema |
| `description` | string | Descrição detalhada do incidente |
| `category` | `IncidentCategory` | Categoria do problema |
| `priority` | `IncidentPriority` | Nível de urgência |
| `status` | `IncidentStatus` | Estado atual no ciclo de vida |
| `assigneeId` | UUID | Referência ao `User` responsável |
| `createdAt` | DateTime | Criação (UTC) |
| `updatedAt` | DateTime | Última modificação (UTC) |
| `resolvedAt` | DateTime \| null | Preenchido automaticamente na resolução |
| `deletedAt` | DateTime \| null | Flag de soft delete |

### `IncidentHistory`
Registro de auditoria imutável associado a um `Incident`.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID | Identificador único |
| `incidentId` | UUID | Referência ao incidente alterado |
| `field` | string | Nome do campo que sofreu alteração |
| `oldValue` | string \| null | Valor antes da alteração |
| `newValue` | string \| null | Valor após a alteração |
| `changedById` | UUID | Referência ao `User` que fez a mudança |
| `changedAt` | DateTime | Momento da alteração (UTC) |

---

## Enums

| Domínio | Valores |
| --- | --- |
| **IncidentStatus** | `OPEN` (Aberto), `IN_PROGRESS` (Em andamento), `RESOLVED` (Resolvido), `CANCELED` (Cancelado) |
| **IncidentPriority** | `LOW` (Baixa), `MEDIUM` (Média), `HIGH` (Alta), `CRITICAL` (Crítica) |
| **IncidentCategory** | `SYSTEM` (Sistema), `NETWORK` (Rede), `INFRASTRUCTURE` (Infraestrutura), `ACCESS` (Acesso), `DATA` (Dados), `PROCESS` (Processo) |

---

## Contrato HTTP (API v1)

Prefixo base: `/api/v1`

### Autenticação (`/auth`)
| Rota | Método | Auth | Propósito |
| --- | --- | --- | --- |
| `/auth/register` | `POST` | Pública | Criar nova conta de usuário |
| `/auth/login` | `POST` | Pública | Autenticar e gerar JWT Access Token |
| `/auth/me` | `GET` | JWT | Obter dados do próprio usuário logado |

### Usuários (`/users`)
| Rota | Método | Auth | Propósito |
| --- | --- | --- | --- |
| `/users` | `GET` | JWT | Listar usuários (ex: para popular select de responsáveis) |
| `/users/:id` | `GET` | JWT | Buscar detalhes de um usuário específico |

### Incidentes (`/incidents`)
| Rota | Método | Auth | Propósito |
| --- | --- | --- | --- |
| `/incidents` | `POST` | JWT | Abrir novo incidente |
| `/incidents` | `GET` | JWT | Listar incidentes com filtros e paginação |
| `/incidents/:id` | `GET` | JWT | Buscar detalhes de um incidente específico |
| `/incidents/:id` | `PATCH` | JWT | Atualizar incidente (título, descrição, prioridade, responsável). **Não permite resolver.** |
| `/incidents/:id/resolve` | `PATCH` | JWT | Endpoint exclusivo para transição de status para `RESOLVED` |
| `/incidents/:id` | `DELETE` | JWT | Remover incidente (Soft Delete) |
| `/incidents/:id/history` | `GET` | JWT | Ver trilha de auditoria (histórico) do incidente |

---

## Paginação e Filtros

Listagens (`GET /incidents` e `GET /users`) suportam paginação através das query strings `?page=1&limit=10`. O payload de retorno segue o formato:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**Filtros disponíveis para `GET /incidents`:**
`status`, `priority`, `category`, `assigneeId`, `createdFrom`, `createdTo`, `resolvedFrom`, `resolvedTo`.
