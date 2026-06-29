# Pos-MVP

Este documento registra ideias e melhorias que podem ser feitas depois da entrega do MVP do teste tecnico.

Objetivo:

- Preservar foco no escopo obrigatorio.
- Evitar que boas ideias atrasem a entrega inicial.
- Manter um backlog tecnico claro para evolucao futura.

Cada item segue a estrutura:

- O que.
- Por que.
- Beneficios.
- Trade-offs.

## 1. Regras Especificas Por Role

### O que

Criar restricoes especificas por perfil de usuario, diferenciando permissoes de `ADMIN` e `USER`.

Exemplos possiveis:

- Apenas `ADMIN` pode remover incidentes.
- Apenas `ADMIN` pode listar usuarios.
- Apenas `ADMIN` pode alterar responsavel de um incidente.
- `USER` pode criar e acompanhar incidentes, mas nao executar acoes administrativas.

### Por que

No MVP, `ADMIN` e `USER` existem como roles, mas nao possuem regras praticas diferentes para incidentes.

Isso reduz escopo inicial e mantem foco nos requisitos obrigatorios do teste tecnico.

### Beneficios

- Aumenta seguranca e controle de acesso.
- Deixa o modelo de autorizacao mais realista.
- Permite evoluir para politicas mais refinadas sem alterar a base de autenticacao.
- Aproveita a role ja presente no modelo `User`.

### Trade-offs

- Exige guards, decorators ou policies adicionais.
- Aumenta matriz de testes de autorizacao.
- Pode tornar a avaliacao manual mais trabalhosa se nao houver seeds e documentacao claras.
- Pode adicionar complexidade que nao e exigida pelo enunciado inicial.

## 2. Purge de Soft Delete Depois de 3 Anos

### O que

Criar uma logica para transformar soft delete em delete fisico apos 3 anos.

Exemplo:

- Incidente removido logicamente recebe `deletedAt`.
- Um job periodico busca registros com `deletedAt` anterior a 3 anos.
- Esses registros sao removidos fisicamente ou anonimizados, conforme politica definida.

### Por que

Soft delete preserva rastreabilidade e evita perda acidental no curto e medio prazo, mas manter dados removidos para sempre pode aumentar custo, complexidade e risco de retencao indevida.

### Beneficios

- Reduz crescimento indefinido do banco.
- Melhora higiene de dados.
- Permite alinhar retencao com uma politica formal.
- Diminui exposicao de dados antigos.

### Trade-offs

- Exige job agendado ou worker.
- Exige definir regra de retencao com cuidado.
- Pode impactar historico, auditoria e relatorios.
- Delete fisico pode ser irreversivel.
- Precisa decidir se historicos relacionados tambem serao removidos, preservados ou anonimizados.

## 3. Logs Estruturados com Pino/NestJS-Pino

### O que

Incluir logs estruturados usando `pino` e `nestjs-pino`.

Possiveis dados de log:

- `requestId`.
- Metodo HTTP.
- Rota.
- Status code.
- Tempo de resposta.
- Usuario autenticado.
- Erros de aplicacao.
- Eventos relevantes de dominio.

### Por que

Logs estruturados sao um diferencial citado pelo enunciado, mas foram deixados para pos-MVP para preservar prazo de entrega.

### Beneficios

- Melhora observabilidade.
- Facilita debug em ambiente local e producao.
- Facilita correlacao de erros com requisicoes.
- Permite integracao futura com ferramentas de monitoramento.
- Ajuda a demonstrar maturidade operacional.

### Trade-offs

- Adiciona dependencia e configuracao.
- Exige cuidado para nao logar dados sensiveis.
- Pode gerar ruido se nao houver padrao de eventos.
- Aumenta escopo de testes e revisao de seguranca.

## 4. Migrar Jest Para Vitest

### O que

Avaliar migracao dos testes de Jest para Vitest.

### Por que

Vitest pode ser significativamente mais rapido, tem API muito compativel com Jest, suporte nativo a ESM e TypeScript, e costuma exigir menos configuracao em projetos modernos.

### Beneficios

- Execucao de testes mais rapida.
- Melhor experiencia de desenvolvimento em watch mode.
- Boa compatibilidade com APIs conhecidas do Jest.
- Suporte moderno a ESM.
- Suporte a TypeScript com menos configuracao adicional.

### Trade-offs

- O enunciado aceita Jest ou Vitest, mas o planejamento do MVP esta em Jest.
- Migrar depois pode exigir ajustes em mocks, setup files e testes e2e.
- Ecossistema NestJS ainda possui muitos exemplos e templates com Jest.
- Pode gerar trabalho adicional sem impacto direto nos requisitos funcionais.
- A equipe precisa validar compatibilidade com `@nestjs/testing`, testes e2e e coverage.

## 5. Evoluir CQRS Simples Para CQRS Completo

### O que

No MVP, o projeto usa CQRS simples como ferramenta organizacional.

Estamos implementando:

- Separacao entre commands e queries.
- Um use case/handler por operacao.
- `@nestjs/cqrs` como infraestrutura de organizacao.
- Commands para fluxos de escrita.
- Queries para fluxos de leitura.
- Event bus em memoria para eventos de dominio quando fizer sentido.

Nao estamos implementando no MVP:

- Read model separado.
- Banco separado para leitura.
- Projecoes assincronas.
- Event sourcing.
- Consistencia eventual para regras obrigatorias.
- Sagas/process managers.

### Por que

O objetivo atual e aproveitar a capacidade organizacional do CQRS sem transformar o teste tecnico em uma arquitetura distribuida ou excessivamente complexa.

Separar commands e queries ja melhora clareza, testabilidade e manutencao. Ao mesmo tempo, manter leitura e escrita no mesmo banco preserva simplicidade operacional.

### Beneficios

- Organiza o codigo por intencao.
- Facilita testes por operacao.
- Reduz controllers gordos.
- Deixa claro quais fluxos alteram estado e quais apenas consultam.
- Prepara o ambiente para evoluir para CQRS completo se a aplicacao crescer.
- Permite introduzir read models, projecoes ou processamento assincrono no futuro sem reescrever toda a aplicacao.

### Trade-offs

- Adiciona estrutura extra mesmo sem read model separado.
- Pode parecer mais verboso do que services tradicionais em um dominio pequeno.
- Exige disciplina para nao misturar command e query no mesmo fluxo.
- `@nestjs/cqrs` adiciona conceitos e providers que precisam ser bem documentados.
- Como nao ha read model separado no MVP, alguns beneficios classicos de CQRS completo ainda nao aparecem.

### Evolucao futura

Se o volume de leitura, relatorios ou consultas complexas crescer, podemos evoluir para:

- Read models especificos.
- Projecoes assincronas.
- Handlers de eventos para montar visoes otimizadas.
- Banco separado para leitura.
- Estrategias de consistencia eventual.
- Sagas/process managers para fluxos longos.

## 6. Evoluir DDD Pragmatico Para DDD Completo

### O que

No MVP, o projeto usa DDD pragmatico como ferramenta organizacional e de modelagem.

Estamos implementando:

- Clean Architecture orientada a DDD pragmatico.
- `Incident` como aggregate root.
- `User` como aggregate root.
- `IncidentHistory` como registro de auditoria associado a `Incident`.
- Entidades ricas com estado privado.
- Alteracoes por metodos de dominio.
- Repository interfaces no dominio/application.
- Unit of Work para transacoes.
- Domain Events em memoria quando agregarem clareza.
- Value Objects seletivos, somente quando houver regra ou ganho claro.
- Erros de dominio/aplicacao mapeados para HTTP na borda.

Nao estamos implementando no MVP:

- Bounded contexts separados.
- Event sourcing.
- Factories complexas.
- Domain Services sem necessidade concreta.
- Sagas/process managers.
- Linguagem ubiqua formalizada alem dos termos principais.
- Separacao completa de subdominios.
- Modelagem extensa para todos os campos simples.

### Por que

O objetivo atual e usar as capacidades organizacionais do DDD para proteger o dominio sem criar excesso de cerimonia.

O dominio do teste tecnico tem regras suficientes para justificar entidades ricas, aggregates e invariantes, mas ainda nao exige a complexidade de DDD completo.

### Beneficios

- Mantem regras de negocio perto do dominio.
- Evita entidades anemicas.
- Reduz vazamento de Prisma, Nest ou DTOs para o core.
- Facilita testes de invariantes.
- Torna o ciclo de vida do incidente mais explicito.
- Prepara o projeto para crescer sem abandonar a base arquitetural.
- Permite evoluir para bounded contexts, domain services e modelagem mais profunda se surgirem novos subdominios.

### Trade-offs

- Exige mais classes e organizacao do que um CRUD simples.
- Pode aumentar o tempo inicial de implementacao.
- Requer disciplina para nao criar Value Objects ou Domain Services desnecessarios.
- Pode parecer superestruturado se o dominio nao crescer.
- Algumas decisoes de modelagem podem precisar ser revistas conforme regras reais aparecerem.

### Evolucao futura

Se a aplicacao crescer, podemos evoluir para:

- Bounded contexts reais.
- Separacao entre subdominios.
- Domain Services para regras entre aggregates.
- Factories quando criacao de aggregates ficar complexa.
- Politicas de dominio mais explicitas.
- Event sourcing se historico completo de estado virar requisito central.
- Linguagem ubiqua mais formal e revisada com stakeholders.

## 7. Separar Bounded Contexts Reais

### O que

Avaliar a separacao de bounded contexts reais caso o sistema cresca para alem do dominio atual de incidentes.

Possibilidades:

- `Incident Management`: ciclo de vida, resolucao, filtros e historico.
- `Identity and Access`: usuarios, autenticacao, permissoes e roles.
- `Audit and Compliance`: retencao, trilha de auditoria, exportacao e politicas.
- `Reporting`: consultas analiticas e read models, se surgirem relatorios pesados.

### Por que

No MVP, separar bounded contexts seria artificial. O dominio ainda e pequeno e o custo de separacao seria maior que o beneficio.

Se novas capacidades surgirem, a separacao pode evitar que regras de autenticacao, auditoria, relatorios e incidentes fiquem acopladas no mesmo modelo.

### Beneficios

- Define limites mais claros entre subdominios.
- Reduz acoplamento entre regras que evoluem em ritmos diferentes.
- Facilita ownership por modulo/equipe no futuro.
- Permite estrategias diferentes de persistencia, leitura e integracao por contexto.
- Complementa a evolucao para DDD completo sem exigir essa complexidade agora.

### Trade-offs

- Aumenta complexidade arquitetural.
- Exige contratos claros entre contextos.
- Pode duplicar modelos parecidos em contextos diferentes.
- Aumenta custo de testes de integracao.
- Pode ser exagerado se o produto continuar restrito ao gerenciamento simples de incidentes.

## 8. Adicionar Mensageria Duravel

### O que

Adicionar uma camada de mensageria duravel no pos-MVP.

Possibilidades:

- RabbitMQ.
- Kafka.
- NATS JetStream.
- AWS SQS/SNS.
- Outbox Pattern com worker.

No MVP, usamos event bus em memoria. Ele ajuda a organizar eventos internos da aplicacao, mas os eventos vivem apenas dentro do processo Node.js.

### Por que

Com event bus em memoria, se o sistema cair antes de um handler processar um evento, esse evento pode ser perdido.

Uma mensageria duravel ajuda a resolver esse problema porque armazena eventos/mensagens fora do processo da aplicacao. Dependendo da tecnologia e configuracao, ela permite reprocessamento, retry, dead-letter queue e auditoria operacional.

Para eventos realmente criticos, a estrategia ideal pode combinar:

- Mensageria duravel.
- Outbox Pattern.
- Publicacao atomica junto da transacao de banco.
- Workers idempotentes.

### Beneficios

- Reduz risco de perda de eventos quando a aplicacao cai.
- Permite retry de processamento.
- Permite dead-letter queue para mensagens com erro recorrente.
- Melhora confiabilidade de efeitos colaterais.
- Facilita integracoes futuras com outros servicos.
- Permite escalar consumidores de eventos separadamente.
- Pode manter log de eventos e permitir replay, dependendo da ferramenta escolhida.

### Trade-offs

- Adiciona infraestrutura externa.
- Aumenta complexidade operacional.
- Exige monitoramento da fila/topico.
- Exige estrategia de idempotencia nos handlers.
- Pode introduzir consistencia eventual.
- Exige cuidado para nao duplicar eventos.
- Pode ser exagerado para o MVP do teste tecnico.

### Evolucao futura

Se a aplicacao crescer, podemos evoluir o event bus em memoria para uma arquitetura com:

- Outbox table no PostgreSQL.
- Worker para publicar eventos pendentes.
- Broker duravel.
- Consumers idempotentes.
- Retry com backoff.
- Dead-letter queue.
- Observabilidade de processamento de eventos.

Regra importante:

- Mesmo com mensageria, regras obrigatorias e atomicas, como atualizacao de incidente + historico RF06, devem continuar consistentes na transacao principal.

## 9. Reaproveitar Schemas Zod no Frontend

### O que

Avaliar o reaproveitamento de schemas Zod do backend em um frontend futuro.

Possibilidades:

- Criar um pacote compartilhado com schemas de contrato.
- Exportar schemas Zod de request/response.
- Gerar tipos TypeScript a partir dos schemas.
- Usar os mesmos schemas para validacao de formularios no frontend.
- Usar os mesmos contratos para validar chamadas HTTP em testes ou clients.

### Por que

O backend ja usa Zod para validar entradas da API. Em um frontend TypeScript, reaproveitar esses schemas pode reduzir duplicacao e manter frontend e backend alinhados.

Isso pode ser especialmente util para formularios como:

- Login.
- Cadastro de usuario.
- Criacao de incidente.
- Atualizacao de incidente.
- Filtros de listagem.

### Beneficios

- Reduz duplicacao de validacao entre backend e frontend.
- Mantem tipos TypeScript alinhados.
- Diminui risco de divergencia entre formulario e API.
- Facilita evolucao de contratos.
- Melhora feedback de validacao no frontend.
- Pode simplificar clients HTTP tipados.

### Trade-offs

- Pode acoplar frontend aos detalhes internos do backend se os schemas nao forem pensados como contratos publicos.
- Schemas de dominio nao devem ser compartilhados diretamente com UI.
- Regras de negocio continuam no backend; validacao no frontend e conveniencia, nao garantia de seguranca.
- Pode exigir monorepo, pacote compartilhado ou processo de build/publicacao.
- Mudancas em schemas compartilhados podem quebrar frontend e backend ao mesmo tempo.
- Precisa separar claramente schemas de transporte de entidades e aggregates de dominio.

### Evolucao futura

Se o projeto ganhar frontend, podemos criar uma camada compartilhada:

```txt
packages/
  contracts/
    auth/
    users/
    incidents/
```

Diretriz:

- Compartilhar schemas de contrato da API.
- Nao compartilhar entidades de dominio ricas.
- Nao expor invariantes internas do aggregate para o frontend.
- Usar Zod no frontend como validacao de experiencia do usuario.
- Manter o backend como fonte final de verdade para regras de negocio.

## 10. Fonte de Tempo Distribuida e Auditoria Temporal

### O que

Avaliar uma estrategia mais robusta para fonte de tempo em ambientes com multiplas instancias, servidores ou servicos distribuidos.

No MVP, a aplicacao usa uma abstracao simples de clock:

```txt
SystemClock -> hora da maquina onde o processo Node.js roda
FixedClock  -> hora fixa para testes automatizados
```

Essa abordagem e suficiente para o monolito modular atual, desde que datas sejam armazenadas em UTC e expostas em ISO 8601.

### Por que

Em sistemas distribuidos, diferentes maquinas podem ter pequenas diferencas de relogio.

Isso pode afetar regras e auditorias que dependem de tempo, como:

- `resolvedAt`.
- `deletedAt`.
- `changedAt` do historico.
- calculo de SLA.
- expiracao de tokens ou convites.
- ordenacao de eventos.
- reconciliacao entre servicos.

Mesmo com NTP, ainda pode haver clock skew, latencia de rede e diferencas pequenas entre servidores.

### Beneficios

- Melhora consistencia temporal entre instancias.
- Reduz risco de eventos parecerem fora de ordem por diferenca de relogio.
- Fortalece auditoria em cenarios com multiplas replicas.
- Facilita evoluir para mensageria duravel, outbox e processamento assincrono.
- Permite testar regras de tempo sem depender do relogio real da maquina.

### Opcoes Futuras

#### 1. Manter `SystemClock` com disciplina operacional

Continuar usando a hora da aplicacao, mas exigir:

- servidores com NTP ativo.
- containers/hosts com timezone controlado.
- armazenamento sempre em UTC.
- exposicao sempre em ISO 8601.
- tolerancia a pequenas diferencas de tempo em regras sensiveis.

Essa opcao tende a ser suficiente para aplicacoes monoliticas ou com baixa distribuicao.

#### 2. Usar horario do banco para campos persistidos criticos

Para campos de auditoria persistidos, considerar o horario do PostgreSQL como fonte de verdade.

Exemplos:

```txt
created_at
updated_at
changed_at
deleted_at
resolved_at
```

Vantagem:

- todos os writes persistidos usam o mesmo relogio: o do banco.

Trade-off:

- use cases deixam de controlar diretamente algumas datas.
- testes precisam considerar valores gerados pela infraestrutura.
- pode exigir ajustes no mapper/repository.

#### 3. Criar um `DatabaseClock`

Implementar uma nova versao da abstracao `Clock` que consulta o banco:

```txt
DatabaseClock -> SELECT now()
```

Vantagem:

- mantem a abstracao de clock.
- permite trocar a fonte de tempo sem espalhar mudancas.

Trade-off:

- adiciona round-trip ao banco.
- pode ser excessivo para fluxos simples.

#### 4. Separar timestamp de ordenacao

Em fluxos com eventos, filas ou outbox, nao depender apenas de timestamp para ordenar acontecimentos.

Alternativas:

- sequencias.
- versoes de aggregate.
- ids ordenaveis.
- ordem de insercao na outbox.
- offsets da fila.

Vantagem:

- evita problemas quando dois eventos acontecem quase ao mesmo tempo ou em servidores diferentes.

### Trade-offs

- Aumenta complexidade arquitetural.
- Pode adicionar dependencia maior do banco.
- Pode tornar testes de integracao mais importantes.
- Pode ser exagerado para o MVP do teste tecnico.
- Exige decisao clara sobre quem e a fonte de verdade do tempo: aplicacao, banco ou infraestrutura externa.

### Decisao Para o MVP

Manter `SystemClock` usando a hora da maquina da aplicacao.

Justificativa:

- o projeto e um monolito modular.
- o banco e unico.
- as regras atuais nao exigem precisao distribuida.
- a abstracao `Clock` ja permite evoluir a fonte de tempo depois.
- testes podem usar `FixedClock` para manter previsibilidade.

Regra importante:

- datas devem continuar armazenadas em UTC e expostas em ISO 8601.
