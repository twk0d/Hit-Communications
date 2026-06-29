# Requisitos do Teste Tecnico

Fonte: documento `HIT_Teste_Tecnico_TypeScript`.

## Objetivo

Desenvolver uma API REST para gerenciamento de incidentes operacionais, seguindo boas praticas de arquitetura, qualidade de codigo, testes automatizados e documentacao.

O projeto deve demonstrar:

- Capacidade tecnica.
- Modelagem.
- Organizacao do codigo.
- Qualidade da solucao.
- Testes.
- Tomada de decisoes arquiteturais.

## Cenario

Uma empresa precisa controlar incidentes operacionais reportados por clientes e equipes internas.

Cada incidente possui um ciclo de vida completo, desde sua abertura ate sua resolucao.

## Requisitos Funcionais

### RF01 - Cadastro de Incidentes

O cadastro de incidente deve conter:

- Titulo.
- Descricao.
- Categoria.
- Prioridade.
- Responsavel.
- Status.

Prioridades exigidas pelo enunciado:

- Baixa.
- Media.
- Alta.
- Critica.

### RF02 - Consulta de Incidentes

A API deve permitir:

- Consultar incidente por ID.
- Listar incidentes.
- Paginar resultados.

### RF03 - Atualizacao de Incidentes

A API deve permitir atualizar:

- Titulo.
- Descricao.
- Prioridade.
- Responsavel.
- Status.

### RF04 - Resolucao de Incidentes

A resolucao de um incidente deve:

- Registrar automaticamente a data de resolucao.
- Atualizar o status para `RESOLVED`.

### RF05 - Filtros

A listagem de incidentes deve permitir filtros por:

- Status.
- Prioridade.
- Categoria.
- Responsavel.
- Data de criacao.
- Data de resolucao.

### RF06 - Historico de Alteracoes

O historico deve registrar:

- Campo alterado.
- Valor anterior.
- Valor novo.
- Data da alteracao.

Decisao adicional aprovada:

- Registrar tambem `changedBy/userId` para identificar o usuario que realizou a alteracao.

Exemplo conceitual:

```json
{
  "incidentId": "uuid",
  "field": "status",
  "oldValue": "OPEN",
  "newValue": "RESOLVED",
  "changedById": "uuid",
  "changedAt": "2026-06-23T14:00:00.000Z"
}
```

## Requisitos Tecnicos Obrigatorios

- TypeScript.
- API REST.
- JSON.
- Versionamento de API.
- Validacao dos dados de entrada.
- Campos obrigatorios.
- Tamanhos minimo e maximo.
- Tratamento de valores invalidos.
- Tratamento de erros `404`, `422` e `500`.
- Testes automatizados para as principais regras de negocio.
- README com instrucoes completas.
- Scripts de banco de dados ou migrations.

## Versionamento de API

O enunciado exige versionamento de API.

Padrao adotado:

```txt
/api/v1
```

Exemplo:

```txt
/api/v1/incidents
```

## Tratamento de Erros Exigido

### 404 - Recurso nao encontrado

Deve retornar mensagem clara e status HTTP correto.

### 422 - Dados invalidos

Deve detalhar os campos com erro e o motivo.

### 500 - Erros internos

Nao deve expor detalhes tecnicos ao cliente da API.

## Testes Obrigatorios

O enunciado exige testes automatizados para:

- Criacao de incidente com dados validos.
- Criacao de incidente com dados invalidos.
- Atualizacao de status.
- Atualizacao dos demais campos.
- Resolucao de incidente.
- Validacao da data automatica de resolucao.
- Validacao do status de resolucao.
- Aplicacao de filtros combinados.
- Geracao do historico de alteracoes.

## Diferenciais do Enunciado

Itens nao obrigatorios, mas considerados positivamente:

- Docker + Docker Compose.
- Swagger/OpenAPI.
- Autenticacao JWT.
- CI/CD.
- Logs estruturados.
- Prisma ORM.
- NestJS.
- Clean Architecture.
- Relatorio de cobertura de testes.

Todos estes diferenciais foram incorporados ao planejamento tecnico do projeto.

## Decisao Arquitetural Adotada

O projeto sera implementado com Clean Architecture orientada a DDD pragmatico.

Isso significa:

- Entidades de dominio ricas.
- Aggregates com limites claros.
- Regras de negocio protegidas no dominio e nos use cases.
- Repository Pattern para isolar persistencia.
- Unit of Work para transacoes.
- CQRS leve para separar comandos e consultas.
- Eventos de dominio em memoria para comunicacao interna quando isso agregar clareza.

Limites do MVP:

- Nao havera event sourcing.
- Nao havera read model separado.
- Nao havera multiplos bounded contexts artificiais.
- Value Objects serao usados apenas quando protegerem regra real ou melhorarem clareza.

## Entregaveis

O projeto final deve conter:

- Codigo-fonte em repositorio Git publico ou compartilhado com o avaliador.
- Historico de commits preservado.
- README com instrucoes de execucao local.
- Instrucoes para rodar testes.
- Variaveis de ambiente necessarias.
- Premissas adotadas durante o desenvolvimento.
- Migrations Prisma ou scripts SQL.
- Collection Postman/Insomnia opcional.
