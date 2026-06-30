# Validacao, Erros e Historico

## Validacao

Ferramenta aprovada:

- Zod.

Integracao aprovada:

- `ZodValidationPipe` global no NestJS.

## Principios de Validacao

As entradas da API devem validar:

- Campos obrigatorios.
- Tipos.
- Tamanhos minimo e maximo.
- Enums.
- Datas.
- UUIDs.
- Valores invalidos.

Separacao DDD:

- Zod valida formato de entrada na borda da aplicacao.
- Entidades e Value Objects protegem invariantes de dominio.
- Use cases validam regras de fluxo e coordenam dependencias.
- Validators nao devem concentrar regra de negocio que pertence ao dominio.

## Exemplos de Validacao por Recurso

### Criacao de Incidente

Campos esperados:

```txt
title
description
category
priority
assigneeId
```

Campos definidos automaticamente:

```txt
status
createdAt
updatedAt
resolvedAt
```

Status inicial recomendado:

```txt
OPEN
```

### Atualizacao de Incidente

Campos atualizaveis:

```txt
title
description
priority
assigneeId
status
```

Observacao:

- O enunciado cita `responsavel`; no modelo adotado, isso sera `assigneeId`.
- O enunciado cita `status`; no endpoint generico de atualizacao, a mudanca para `RESOLVED` sera bloqueada.
- A resolucao deve acontecer pelo endpoint dedicado `PATCH /api/v1/incidents/:id/resolve`.
- Incidentes ja resolvidos nao podem ser alterados pelo endpoint generico de atualizacao.

## Formato de Erro Aprovado

Formato aprovado para validacao:

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

## Erros HTTP

### 404

Usar quando um recurso nao for encontrado.

Exemplos:

- Incidente inexistente.
- Usuario responsavel inexistente.
- Historico de incidente inexistente, se aplicavel.

### 422

Usar quando a entrada for invalida ou violar uma regra de negocio.

Exemplos:

- Payload invalido.
- Enum invalido.
- Usuario responsavel inexistente em criacao/atualizacao de incidente.
- Tentativa de resolver incidente ja resolvido.
- Tentativa de definir `status` como `RESOLVED` pelo endpoint generico de atualizacao.
- Tentativa de atualizar incidente ja resolvido.

### 500

Usar para erros internos nao previstos.

Regra:

- Nao expor detalhes tecnicos ao cliente da API.
- Logar detalhes internamente.

## Erros de Dominio e Aplicacao

Os use cases e entidades devem usar erros proprios, sem depender de excecoes HTTP do Nest.

Erros planejados:

```txt
ResourceNotFoundError
ValidationError
BusinessRuleViolationError
UnauthorizedError
ConflictError
```

Mapeamento esperado:

- `ResourceNotFoundError` -> `404`.
- `ValidationError` -> `422`.
- `BusinessRuleViolationError` -> `422`.
- `UnauthorizedError` -> `401`.
- `ConflictError` -> `409`.

## Historico de Alteracoes

Requisito:

- Registrar alteracoes campo a campo.

Campos:

```txt
incidentId
field
oldValue
newValue
changedById
changedAt
```

## Estrategia `diffAndRecord()`

Decisao aprovada:

- Encapsular a comparacao e persistencia do historico dentro do use case de atualizacao.

Fluxo:

1. Buscar o incidente atual.
2. Validar regras de negocio.
3. Montar o novo estado.
4. Comparar campo a campo.
5. Criar registros de historico somente para campos alterados.
6. Persistir atualizacao e historico na mesma transacao Prisma.

Observacao DDD:

- A entidade `Incident` deve proteger alteracoes validas.
- O use case de atualizacao deve orquestrar diff, repositorios e Unit of Work.
- `IncidentHistory` e um registro de auditoria, nao um mecanismo assincrono para corrigir alteracoes depois.

Campos inicialmente considerados para diff:

```txt
title
description
priority
assigneeId
status
resolvedAt
```

Observacao:

- `category` nao aparece no RF03 como campo atualizavel.
- Como `category` aparece em RF01 e RF05, a atualizacao dela deve ser evitada a menos que haja decisao explicita para permitir.

## Consulta de Historico

Endpoint aprovado:

```txt
GET /api/v1/incidents/:id/history
```

Comportamento esperado:

- Retornar historico ordenado por `changedAt` decrescente ou crescente.
- Recomendacao: usar ordem decrescente por padrao, mostrando alteracoes mais recentes primeiro.
