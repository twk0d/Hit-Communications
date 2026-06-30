# Decisoes Tecnicas

Este documento registra as decisoes ja alinhadas para a implementacao do teste tecnico.

## Stack

Stack aprovada:

- NestJS.
- TypeScript.
- npm.
- Prisma ORM.
- PostgreSQL.
- Docker.
- Docker Compose.
- Zod.
- Jest.
- Swagger/OpenAPI.
- JWT.
- GitHub Actions.
- `@nestjs/cqrs`.
- Argon2id para hash de senhas.

## Arquitetura

Arquitetura aprovada:

- Clean Architecture orientada a DDD pragmatico e Modulariedade.
- Modulos hibridos.
- Feature modules para dominio.
- Camadas globais separadas em `shared/` e `infra/`.
- Estrutura feature-first.
- Um use case por operacao.
- CQRS leve com separacao entre commands e queries.
- Eventos de dominio em memoria com event bus.
- Entidades de dominio ricas, com estado privado e alteracoes por metodos de dominio.
- Aggregates com limites claros.
- Value Objects usados de forma seletiva.

Diretriz:

- Regras de negocio ficam isoladas da infraestrutura.
- Use cases nao importam Prisma diretamente.
- Controllers devem ser finos.
- Validacao de entrada deve acontecer antes da execucao dos use cases.
- Repositories devem expor interfaces de dominio.
- Operacoes criticas que exigem consistencia devem permanecer sincronas.
- Eventos em memoria nao substituem transacoes de banco nem historico obrigatorio.
- Entidades protegem invariantes do dominio.
- Use cases orquestram fluxo, autorizacao, transacoes, repositorios e publicacao de eventos.
- Evitar DDD cerimonial sem ganho real para o MVP.

## DDD Pragmatico

Decisao aprovada:

- Usar DDD pragmatico como estilo de modelagem.

Componentes do dominio:

- `Incident` como aggregate root.
- `User` como aggregate root.
- `IncidentHistory` como registro de auditoria associado a `Incident`.
- Domain Events para eventos relevantes, como incidente criado, atualizado ou resolvido.
- Value Objects apenas quando houver regra ou clareza suficiente para justificar.

Limites:

- Nao usar event sourcing no MVP.
- Nao criar bounded contexts artificiais.
- Nao criar factories, domain services ou value objects sem necessidade concreta.
- Nao delegar regras atomicas obrigatorias para eventos assincronos.

## Acesso ao Banco

Padrao aprovado:

- Repository Pattern.
- Interface de repositorio no core/dominio.
- Implementacao Prisma na camada de infraestrutura.
- Unit of Work para coordenar transacoes.

Regra:

- Use cases dependem de abstracoes.
- Prisma fica encapsulado nas implementacoes de infraestrutura.
- Transacoes Prisma ficam atras de uma abstracao de aplicacao/infra.

## Historico de Alteracoes

Decisao aprovada para RF06:

- Implementar um metodo `diffAndRecord()` encapsulado no use case de atualizacao.
- O metodo compara o estado anterior e o novo estado campo a campo.
- O metodo persiste o historico na mesma transacao Prisma da atualizacao, coordenada por Unit of Work.

Campos do historico:

- `incidentId`.
- `field`.
- `oldValue`.
- `newValue`.
- `changedById`.
- `changedAt`.

Motivacao:

- Garante consistencia entre atualizacao e historico.
- Evita duplicacao de logica entre controllers, services e repositories.
- Mantem o RF06 dentro da regra de negocio.

## Validacao

Decisao aprovada:

- Usar Zod para validacao.
- Usar `ZodValidationPipe` global.

Diretrizes:

- Criar schemas Zod por entrada de rota.
- Validar campos obrigatorios.
- Validar tamanhos minimo e maximo.
- Validar enums.
- Validar formatos de data.
- Retornar erro `422` para payloads invalidos.

## Testes

Decisao aprovada:

- Usar Jest.
- Testar use cases isolados com repositorios mockados.
- Criar testes e2e para endpoints principais.

Cobertura obrigatoria:

- Criacao valida e invalida.
- Atualizacao.
- Resolucao.
- Filtros combinados.
- Historico de alteracoes.

## Documentacao da API

Decisao aprovada:

- Usar Swagger/OpenAPI.
- Documentar rotas, schemas, exemplos de request e exemplos de response.

## Autenticacao

Decisao aprovada:

- Usar autenticacao JWT real.
- Usar somente access token no MVP.
- Nao implementar refresh token no MVP.
- Usar Argon2id para hash de senhas.
- Modelar `responsavel` como entidade `User`.
- Usar `assigneeId` no incidente para apontar para o usuario responsavel.
- Manter `POST /api/v1/auth/register` publico para facilitar a avaliacao.

## Autorizacao

Decisoes aprovadas:

- Usar apenas os perfis `ADMIN` e `USER`.
- Usuarios autenticados podem visualizar todos os incidentes.
- A listagem deve permitir filtrar incidentes atribuidos a uma pessoa.
- No MVP, `ADMIN` e `USER` nao terao regras de permissao diferentes para incidentes.

Observacao:

- Regras mais restritivas por perfil podem ser evoluidas depois, mas nao fazem parte do escopo inicial.

## Identificadores

Decisao aprovada:

- Usar UUID como padrao para IDs em todas as tabelas.

## Soft Delete

Decisao aprovada:

- Trabalhar com soft delete.
- Entidades removiveis devem possuir `deletedAt`.
- Consultas padrao devem ignorar registros com `deletedAt` preenchido.
- Incluir `DELETE /api/v1/incidents/:id` como soft delete de incidente.
- Preparar `deletedAt` em `User`, mas nao expor delete de usuario no MVP.

## Datas

Decisao aprovada:

- Armazenar datas em UTC.
- Expor datas em ISO 8601.

## Logs Estruturados

Decisao aprovada:

- Logs estruturados entram no MVP com Pino/NestJS-Pino.
- Toda resposta HTTP deve incluir `x-request-id`.
- O backend deve reutilizar `x-request-id` recebido do cliente ou gerar um UUID quando ausente.
- Dados sensiveis como senha, hash, token, cookies, `Authorization` e secrets devem ser mascarados nos logs.
- Logs nao substituem RF06, historico persistido ou transacoes obrigatorias.

## Swagger

Decisao aprovada:

- Documentacao Swagger/OpenAPI com exemplos completos nos endpoints principais.

## Seeds

Decisao aprovada:

- Criar seed com usuarios de exemplo para facilitar a avaliacao.

## Paginacao e Ordenacao

Decisoes aprovadas:

- Retorno direto para recursos unicos.
- Envelope com `data` e `meta` para listas paginadas.
- `page` padrao igual a `1`.
- `limit` padrao igual a `10`.
- `limit` maximo igual a `100`.
- Ordenacao padrao por `createdAt desc`.

## Collection

Decisao aprovada:

- Entregar collection Insomnia como diferencial.

## CI/CD

Decisao aprovada:

- Usar GitHub Actions.

Pipeline recomendado:

- Instalar dependencias.
- Rodar Prisma generate.
- Rodar lint.
- Rodar testes.
- Rodar build.

## Commits

Padrao aprovado:

- Commits semanticos.
- Primeiro commit real deve enviar as documentacoes e artefatos de IA.
- Scaffold e codigo da aplicacao devem vir depois.

Tipos principais:

- `feat`.
- `fix`.
- `chore`.
- `test`.
- `docs`.
- `refactor`.

## Ambiente de Desenvolvimento

Ambiente informado:

- Windows.
- WebStorm.
- Node 24 LTS.
- Docker Desktop.
