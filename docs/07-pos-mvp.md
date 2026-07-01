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

### 7. Proteção Avançada de Credenciais no Trânsito
**O que é:** Evoluir o contrato de cadastro/login para não depender apenas do envio de `password` em texto claro no JSON. Possíveis caminhos: TLS obrigatório com HSTS, criptografia assimétrica do payload por sessão, PAKE/SRP, ou autenticação moderna com WebAuthn/passkeys. O backend continuaria responsável pelo hash Argon2id; um hash estável calculado no client não deve virar a "senha" reutilizável.
**Por que ficou fora:** O MVP prioriza testabilidade via Swagger/Insomnia e simplicidade do contrato HTTP. A segurança de armazenamento já foi tratada com Argon2id e os logs mascaram campos sensíveis. Criptografia no client exige client real, gestão de chaves/challenges e testes E2E mais complexos.

### 8. Rate Limiting e Proteção contra Força Bruta
**O que é:** Aplicar limites por IP, usuário e rota, principalmente em `/auth/login` e `/auth/register`, com backoff progressivo, lockout temporário e logs/auditoria de tentativas suspeitas.
**Por que ficou fora:** O teste técnico foca no fluxo funcional e na arquitetura de domínio. Rate limiting depende de decisões operacionais como Redis, API Gateway, proxy reverso ou middleware dedicado, que aumentariam a infraestrutura do MVP.

### 9. Gestão Completa de Contas e Recuperação de Senha
**O que é:** Adicionar fluxos de convite de usuário, alteração de senha, recuperação por token temporário, verificação de email, desativação/reativação de contas e administração de perfis.
**Por que ficou fora:** O MVP precisava apenas autenticar usuários e associá-los como responsáveis por incidentes. Fluxos de conta exigem envio de email, tokens de curta duração, telas/clientes dedicados e novas políticas de segurança.

### 10. MFA, SSO e Passkeys
**O que é:** Suportar segundo fator (TOTP/WebAuthn), login corporativo via OIDC/SAML e passkeys para reduzir dependência de senha.
**Por que ficou fora:** A autenticação atual com JWT access token e Argon2id cobre o requisito do teste. SSO/MFA envolve provedores externos, onboarding de organizações, recuperação de acesso e matrizes de risco mais amplas.

### 11. Políticas de SLA e Escalonamento de Incidentes
**O que é:** Definir prazos por prioridade/categoria, campos como `dueAt`, `breachedAt` e `escalatedAt`, além de regras automáticas para escalar incidentes críticos ou vencidos.
**Por que ficou fora:** O domínio atual cobre ciclo de vida básico, responsável, prioridade e resolução. SLA introduz regras de negócio mais específicas da operação real da empresa e exigiria jobs agendados ou verificações periódicas.

### 12. Notificações Operacionais
**O que é:** Notificar responsáveis e gestores quando incidentes forem criados, atribuídos, atualizados, resolvidos ou violarem SLA, usando email, Slack/Teams, webhooks ou filas.
**Por que ficou fora:** Notificações confiáveis pedem integração externa e, idealmente, Outbox/retentativa para não perder eventos. Para o MVP, a consistência da auditoria síncrona era mais importante que integrações assíncronas.

### 13. Comentários, Anexos e Evidências
**O que é:** Permitir que usuários registrem comentários operacionais, anexem logs/prints/documentos e mantenham uma linha do tempo mais rica do atendimento ao incidente.
**Por que ficou fora:** O escopo inicial exigia histórico de alterações de campos, não colaboração em tempo real. Anexos também adicionariam storage, antivírus/validação de arquivos e regras de retenção.

### 14. Busca Avançada, Ordenação e Exportação
**O que é:** Adicionar busca textual por título/descrição, ordenação configurável, filtros salvos, paginação por cursor para grandes volumes e exportação CSV/Excel dos incidentes.
**Por que ficou fora:** Os filtros atuais por status, prioridade, categoria, responsável e datas atendem ao MVP. Busca avançada poderia exigir índices específicos, full-text search do Postgres ou ElasticSearch, além de novos testes de performance.

### 15. Dashboards de Operação e Indicadores de Incidentes
**O que é:** Criar endpoints e/ou read models para métricas como MTTR, volume por categoria, incidentes por responsável, gargalos por status, taxa de reincidência e cumprimento de SLA.
**Por que ficou fora:** A observabilidade implementada olha para saúde técnica da API. Indicadores de negócio dependem de definições operacionais e possivelmente de agregações otimizadas para leitura.

### 16. Controle de Concorrência e Idempotência
**O que é:** Adicionar `version`/optimistic locking para evitar perda de atualização concorrente e suportar `Idempotency-Key` em comandos sensíveis como criação e resolução.
**Por que ficou fora:** O MVP executa comandos simples e transacionais, mas não modela múltiplos operadores editando o mesmo incidente simultaneamente. Esse controle adiciona contratos HTTP e regras de conflito mais detalhadas.

### 17. Multi-tenancy e Escopo Organizacional
**O que é:** Separar dados por cliente, unidade, departamento ou organização, garantindo que usuários só acessem incidentes do seu escopo.
**Por que ficou fora:** O requisito assume uma operação interna única onde usuários autenticados podem listar incidentes. Multi-tenancy mudaria a modelagem, os filtros padrão, os índices, os testes E2E e as regras de autorização.

### 18. Hardening de Produção da API
**O que é:** Adicionar configuração explícita de CORS, Helmet/security headers, proteção ou desativação do Swagger em produção, rotação de `JWT_SECRET`, health checks, readiness/liveness e gestão de secrets fora do `.env`.
**Por que ficou fora:** O projeto entrega um ambiente local completo para avaliação técnica. Hardening de produção depende da plataforma alvo (Kubernetes, ECS, VM, gateway corporativo, secret manager) e ficaria fora do escopo do teste.

### 19. Auditoria Imutável e Evidências de Segurança
**O que é:** Fortalecer `IncidentHistory` com metadados como IP, user-agent, motivo da alteração e hash encadeado/tamper-evident para detectar adulteração da trilha de auditoria.
**Por que ficou fora:** O MVP já garante histórico obrigatório e transacional para alterações de incidente. Auditoria forense exige requisitos legais/operacionais mais precisos e aumenta a complexidade de persistência e consulta.

### 20. Checklist OWASP Top 10 2025
**O que é:** Revisar a API contra a lista oficial [OWASP Top 10 2025](https://owasp.org/www-project-top-ten/) e transformar lacunas em roadmap técnico.
**Situação no MVP:** O projeto já cobre parte relevante da superfície: JWT nas rotas protegidas, validação global com Zod, Prisma sem SQL raw no código de produção, Argon2id para senhas, redaction de logs sensíveis, erro 500 genérico e regras de domínio protegidas por use cases/entidades. Ainda assim, a cobertura é parcial para produção real.
**Por que ficou fora:** O teste técnico priorizou o ciclo de vida de incidentes, arquitetura limpa, testes e observabilidade local. Um programa OWASP completo exigiria hardening de plataforma, segurança de supply chain, threat modeling, alertas operacionais e políticas de deploy.

| OWASP 2025 | Situação atual | Pós-MVP recomendado |
| --- | --- | --- |
| **A01 - Broken Access Control** | Rotas de `users` e `incidents` usam JWT, mas não há RBAC granular, ownership, escopo organizacional ou multi-tenancy. | Evoluir os itens 2 e 17 com policy guards/capabilities, testes negativos de autorização e matriz de permissões por operação. |
| **A02 - Security Misconfiguration** | Prefixo `/api/v1`, validação e filtro global ajudam, mas Swagger fica sempre exposto e não há CORS/Helmet/security headers configurados. | Evoluir o item 18 com headers seguros, CORS por ambiente, Swagger restrito em produção, health/readiness e secrets fora do `.env`. |
| **A03 - Software Supply Chain Failures** | O projeto usa `package-lock.json`, `npm ci` e CI, mas não há auditoria de dependências, Dependabot/Renovate, SBOM, CodeQL ou scan de imagem Docker. | Adicionar `npm audit`/SCA no CI, atualização automática de dependências, SBOM CycloneDX/SPDX, CodeQL e scan de container. |
| **A04 - Cryptographic Failures** | Senhas são armazenadas com Argon2id e segredos são redigidos dos logs, mas credenciais ainda entram como `password` no payload e TLS/HSTS ficam fora da aplicação local. | Evoluir os itens 7 e 18 com TLS obrigatório no ambiente real, HSTS, rotação de segredo JWT e alternativa segura para credenciais no trânsito. |
| **A05 - Injection** | DTOs Zod validam entrada e os repositórios usam Prisma query builder; não há `queryRaw`/`executeRaw` no código de produção. | Manter a regra de não usar SQL raw sem revisão, adicionar testes para payloads maliciosos e lint/regra de revisão para bloquear APIs raw. |
| **A06 - Insecure Design** | Clean Architecture, entidades ricas, Unit of Work e testes reduzem risco de desenho inseguro, mas não existe threat modeling formal. | Criar threat model por fluxo crítico, abuso de casos de uso, requisitos de segurança por endpoint e revisão arquitetural periódica. |
| **A07 - Authentication Failures** | Login usa Argon2id + JWT com expiração, mas não há refresh token, MFA/passkeys, lockout, rate limit ou recuperação de conta. | Evoluir os itens 1, 8, 9 e 10 com rate limiting, lockout progressivo, reset seguro de senha, MFA/SSO/passkeys e rotação/revogação de tokens. |
| **A08 - Software and Data Integrity Failures** | Migrations, lockfile e CI dão previsibilidade, mas builds/deploys não são assinados e não há validação de integridade de artefatos. | Assinar imagens/artefatos, proteger ambientes de deploy, exigir revisão de migrations, usar checksums/SBOM e restringir permissões do pipeline. |
| **A09 - Logging and Alerting Failures** | Há logs estruturados, `x-request-id`, redaction e operação por use case, mas não há alertas de segurança ou runbooks. | Evoluir os itens 3 e 19 com alertas para login suspeito, falhas 401/403/5xx, mudanças sensíveis, dashboards de segurança e runbooks. |
| **A10 - Mishandling of Exceptional Conditions** | O filtro HTTP padroniza erros de domínio e oculta detalhes em 500, mas faltam graceful shutdown, circuit breakers/timeouts e exercícios de falha. | Adicionar shutdown hooks, timeouts, retries controlados, runbooks de incidente, testes de falha e monitoramento de degradação. |
