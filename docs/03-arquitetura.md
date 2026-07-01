# Arquitetura do Projeto

O projeto segue a **Clean Architecture** aliada aos conceitos de **DDD Pragmático**, priorizando a clareza de fronteiras e a proteção das regras de negócio.

## Diagrama de Camadas e Módulos

A aplicação é um monólito modular (Feature-first). As dependências sempre apontam para dentro (Domínio), e a infraestrutura fica nas bordas.

```txt
src/
  modules/
    auth/
    users/
    incidents/
      domain/          <-- Entidades, Enums, Contratos (Repositories) e Errors
      application/     <-- Use Cases, Commands, Queries (Orquestração)
      infra/           <-- Prisma Repositories, Mappers, Implementações concretas
      presentation/    <-- Controllers HTTP, DTOs, Schemas Zod
  shared/              <-- Abstrações comuns (UnitOfWork, Pagination)
  infra/               <-- Setup global do Prisma e Logger
```

## Responsabilidades das Camadas

### 1. Camada de Domínio (`domain/`)
- É o coração da aplicação. Não importa **nenhuma** biblioteca externa relacionada a banco de dados ou HTTP.
- Contém as Entidades Ricas (ex: `Incident.ts`, `User.ts`), que possuem métodos para alterar seu próprio estado de forma segura, garantindo invariantes (ex: `incident.resolve()`).
- Define as interfaces dos repositórios, ditando como o banco de dados deve se comunicar com a aplicação, mas sem implementá-los.

### 2. Camada de Aplicação (`application/`)
- Orquestra as operações (Use Cases). Cada Use Case tem um único propósito.
- Trabalha com um padrão leve de **CQRS**, separando intenções de leitura (Queries) e escrita (Commands).
- Não conhece o framework HTTP. Só se comunica com o Domínio e com as portas definidas por ele.
- Gerencia o **Unit of Work** para garantir a atomicidade de transações complexas (ex: atualizar um incidente e salvar o histórico simultaneamente).

### 3. Camada de Apresentação (`presentation/`)
- Recebe as requisições HTTP via Controllers do NestJS.
- Valida os dados de entrada usando Schemas do Zod (`ZodValidationPipe`).
- Formata as saídas e mapeia os erros de domínio para status HTTP adequados (`422`, `404`, `409`, etc).

### 4. Camada de Infraestrutura (`infra/`)
- Onde a "sujeira" fica escondida. Implementa as interfaces do domínio utilizando o **Prisma ORM**.
- Converte os dados brutos do banco de dados para as instâncias reais das Entidades de Domínio usando Mappers (ex: `PrismaIncidentMapper`).
- Nenhum tipo gerado pelo Prisma deve "vazar" para fora desta camada.

## Regras de Fronteira Estritas

1. O Domínio **não sabe** que o banco de dados existe (nenhum decorator de persistência).
2. A Aplicação **não sabe** que é servida via REST (nenhum objeto Request/Response do Express/Nest).
3. A Apresentação **não executa** regras de negócio.
4. Nenhuma camada interna pode importar algo de uma camada mais externa.
