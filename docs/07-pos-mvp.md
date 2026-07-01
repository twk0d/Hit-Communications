# Pós-MVP (Evoluções Futuras)

Este documento registra funcionalidades e melhorias arquiteturais que foram mapeadas, mas conscientemente **excluídas do MVP** para manter o escopo alinhado aos prazos e prioridades do teste técnico.

---

### 1. Refresh Token
**O que é:** Implementação de rota para girar o `access_token` JWT expirado de forma transparente.
**Por que ficou fora:** O MVP foca em testar a modelagem e a segurança central. O JWT de 1h é suficiente para validar as regras sem adicionar complexidade de armazenamento de *refresh tokens* ou blacklisting no Redis.

### 2. Regras Estritas de Role-Based Access Control (RBAC)
**O que é:** Restringir operações baseado no `role` (`ADMIN` vs `USER`). Exemplo: Só um `ADMIN` poderia alterar prioridade, e o `USER` só veria seus próprios incidentes.
**Por que ficou fora:** Os requisitos do teste não detalham permissões específicas por perfil além do cadastro. Assumimos que todos os usuários do sistema interno podem visualizar e atuar em incidentes.

### 3. OpenTelemetry e Métricas Avançadas
**O que é:** Instrumentar a aplicação para gerar Traces distribuídos e Métricas (Prometheus) além dos logs comuns.
**Por que ficou fora:** Foi implementado o básico bem feito (Logs Estruturados JSON via Pino + correlação via `x-request-id`). Tracing distribuído faz mais sentido quando o sistema começar a se comunicar com outros microsserviços fora do monólito.

### 4. Bounded Contexts Duros e Mensageria Durável (Outbox/Kafka)
**O que é:** Separar o módulo `auth` ou `users` em um domínio fisicamente ou logicamente isolado que se comunica com `incidents` apenas via Kafka (ou RabbitMQ) usando o pattern Outbox.
**Por que ficou fora:** Inserir um Message Broker adicionaria um peso imenso à infraestrutura local e à curva de avaliação. Para o MVP, módulos se comunicam de forma síncrona dentro do monólito.

### 5. CQRS Completo com Read Models Separados
**O que é:** Ter um banco de dados relacional para escritas (Commands) e projetar os eventos num banco de dados NoSQL (como MongoDB ou ElasticSearch) otimizado apenas para buscas de incidentes (Queries).
**Por que ficou fora:** Over-engineering. O Postgres lida com as listagens e paginações do escopo sem gargalar.

### 6. Cronjob de Limpeza (Purge) para Soft Delete
**O que é:** Um script agendado que apaga fisicamente os registros que receberam `deletedAt` há mais de 5 anos (atendendo à LGPD ou políticas de retenção).
**Por que ficou fora:** Não faz sentido em ambiente de teste rápido, mas na vida real o soft delete acumula lixo no banco indefinidamente.
