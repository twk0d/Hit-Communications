# Requisitos do Teste Técnico

Este documento consolida os requisitos funcionais e não-funcionais extraídos do enunciado do teste técnico, servindo como base objetiva do escopo do projeto.

## Objetivo
Desenvolver uma API REST para gerenciamento de incidentes operacionais, focada em boas práticas de arquitetura, qualidade de código, testes automatizados e documentação.

## Cenário
Uma empresa precisa controlar incidentes operacionais reportados por clientes e equipes internas. Cada incidente possui um ciclo de vida completo (abertura até resolução), com possibilidade de consulta, filtros, atualização e auditoria das alterações realizadas.

---

## Requisitos Funcionais (RF)

### RF01 - Cadastro de Incidentes
Permitir a criação de um incidente com os seguintes dados obrigatórios:
- Título
- Descrição
- Categoria
- Prioridade (Baixa, Média, Alta, Crítica)
- Responsável (Usuário associado)
- Status (Estado inicial)

### RF02 - Consulta de Incidentes
A API deve permitir:
- Consultar incidente por ID.
- Listar incidentes.
- Paginar resultados.

### RF03 - Atualização de Incidentes
A API deve permitir a atualização dos seguintes campos de um incidente:
- Título
- Descrição
- Prioridade
- Responsável
- Status (restrição de negócio: não pode ser atualizado para "Resolvido" por esta via).

### RF04 - Resolução de Incidentes
Fluxo dedicado para resolução que deve:
- Atualizar o status para "Resolvido".
- Registrar automaticamente a data de resolução.
- Impedir nova resolução de incidente já resolvido.

### RF05 - Filtros
A listagem de incidentes deve permitir filtros pelos campos:
- Status
- Prioridade
- Categoria
- Responsável
- Data de criação
- Data de resolução

### RF06 - Histórico de Alterações
O histórico deve auditar mudanças nos incidentes, registrando obrigatoriamente:
- Qual incidente foi alterado
- Qual campo foi alterado
- Valor anterior
- Valor novo
- Quem realizou a alteração
- Data/hora da alteração

---

## Requisitos Técnicos e Não-Funcionais (RNF)

- **Linguagem e Runtime:** TypeScript (Node.js)
- **API:** RESTful com endpoints versionados (ex: `/api/v1`)
- **Transporte:** Entrada e saída obrigatoriamente em JSON
- **Validação de Entrada:** Validação rigorosa de todos os dados de entrada, garantindo que os campos obrigatórios estejam presentes e válidos.
- **Tratamento de Erros:**
  - `404` para recursos não encontrados.
  - `422` (ou `400`) para falhas de validação de payload com descritivo dos campos inválidos.
  - `500` genérico para falhas internas, sem vazar detalhes técnicos do servidor.
- **Testes:**
  - Testes unitários focados nas regras de negócio.
  - Cobertura dos fluxos principais (criação, atualização, resolução, listagem e histórico).
- **Documentação:** README contendo orientações de como rodar a aplicação localmente.
- **Banco de Dados:** Utilização de PostgreSQL (via ORM como Prisma ou similar), com migrations para criação do schema.

## Diferenciais (Nice to Have)
Itens listados pelo teste técnico como pontos positivos:
- Docker e Docker Compose
- Documentação interativa (Swagger/OpenAPI)
- Autenticação (JWT)
- CI/CD
- Logs estruturados
- Padrões arquiteturais claros (Clean Architecture / DDD)
