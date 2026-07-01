# Decisões Técnicas e Trade-offs

Este documento registra as escolhas fundamentais da arquitetura e da stack do projeto. Diferente de um guia prático, o foco aqui é explicar **o que foi considerado e por que foi escolhido**, evidenciando o racional por trás de cada decisão.

---

## 1. Stack Base: NestJS + TypeScript

**Escolha:** NestJS como framework de backend.

**Alternativas consideradas:**
- **Express / Fastify "puro":** Trazem liberdade total, mas exigem construir a arquitetura do zero (injeção de dependência, roteamento, pipes).
- **AdonisJS:** Excelente framework opinionated, mas possui menor aderência no mercado corporativo brasileiro em comparação ao NestJS.

**Por que esta:** NestJS foi escolhido por fornecer uma arquitetura robusta "out-of-the-box" (módulos, DI, decorators) que se alinha muito bem com os padrões da Clean Architecture e DDD, facilitando a separação de responsabilidades.

---

## 2. Modelagem: DDD Pragmático

**Escolha:** Utilizar conceitos do Domain-Driven Design de forma seletiva (DDD pragmático).

**Alternativas consideradas:**
- **DDD Completo (By the book):** Criação de múltiplos Bounded Contexts estritos, Domain Services, Factories, e Value Objects para tudo.
- **MVC Tradicional (Data-Driven):** Entidades como meros DTOs anêmicos e lógica centralizada em "Services" gigantes.

**Por que esta:** Um teste técnico ou MVP não possui a complexidade organizacional de múltiplos times que exige Bounded Contexts duros. Optei por focar no que o DDD traz de melhor para a manutenibilidade:
- **Entidades Ricas:** `Incident` e `User` controlam seu próprio estado.
- **Aggregates:** Invariantes de negócio são protegidas (ex: não reabrir um incidente resolvido).
- **Isolamento:** Domínio não conhece banco de dados ou HTTP.

*Trade-off aceito:* Menos expressividade extrema (poucos Value Objects) em troca de um código mais direto e com menor "cerimônia", adequado ao escopo.

---

## 3. Persistência: Prisma ORM Isolado

**Escolha:** Prisma ORM com Repository Pattern e Unit of Work.

**Alternativas consideradas:**
- **TypeORM / MikroORM:** Tradicionais no ecossistema NestJS, mas possuem APIs mais verbosas e exigem decorators de banco misturados nas entidades (se não usar o modo entity-schema).
- **Prisma "vazando" nos services:** Importar o `PrismaClient` direto nos Use Cases.

**Por que esta:** O Prisma foi escolhido por ter tipagem impecável e migrações fáceis. No entanto, para evitar que o domínio fique acoplado à infraestrutura do Prisma, ele foi posicionado **estritamente na camada de Infra**. Repositories injetados nos Use Cases atuam como adaptadores, e um `Unit of Work` orquestra as transações.

---

## 4. Histórico de Alterações (Auditoria Síncrona)

**Escolha:** Salvar o `IncidentHistory` de forma síncrona, na mesma transação da atualização do incidente via Unit of Work.

**Alternativas consideradas:**
- **Eventos Assíncronos (Message Broker / EventEmitter):** Publicar um evento `IncidentUpdated` e um listener salvar o histórico no fundo.
- **Triggers no Banco:** Deixar o PostgreSQL gerar o histórico automaticamente.

**Por que esta:** O requisito RF06 determina que o histórico é uma regra obrigatória e vital. Se a fila falhar no meio de um evento assíncrono, perdemos o histórico, o que quebra o requisito de consistência. Como o tráfego atual não exige alta vazão assíncrona, a transação síncrona garante atomicidade perfeita (tudo ou nada) sem introduzir complexidade de arquitetura distribuída.

---

## 5. Hashing de Senhas: Argon2id

**Escolha:** Argon2id via biblioteca `argon2` (binding C nativo).

**Alternativas consideradas:**
- **Bcrypt:** O padrão da indústria e do ecossistema Node.js. No entanto, é vulnerável a ataques de aceleração via GPU/ASIC por ser apenas CPU-hard.
- **Scrypt:** Também é memory-hard (resistente a GPUs), mas o Argon2 venceu a *Password Hashing Competition* (PHC) e é a recomendação atual do OWASP.

**Por que esta:** Maior segurança criptográfica para armazenamento de senhas.

*Trade-off aceito:* A dependência de compilação C nativa pode causar atritos no setup inicial local sem Docker, mas como o projeto entrega um `docker-compose.yml`, o ambiente é padronizado.

---

## 6. Validação de Entrada: Zod

**Escolha:** Zod como schema builder integrado ao Nest via Pipe Global.

**Alternativas consideradas:**
- **class-validator / class-transformer:** Padrão ouro no NestJS. Baseado em decorators.

**Por que esta:** `class-validator` depende de metaprogramação (reflection) pesada e às vezes se comporta mal com inferência de tipos. O Zod aborda a validação "schema-first", gerando tipos estáticos infalíveis, mensagens de erro declarativas fáceis de customizar (ex: 422) e integração nativa ao Swagger via plugins.

---

## 7. Remoção de Dados: Soft Delete

**Escolha:** Utilizar a flag/timestamp `deletedAt` em vez de exclusão física.

**Alternativas consideradas:**
- **Hard Delete (DELETE físico):** Apagar o registro do banco.

**Por que esta:** Incidentes e usuários têm alto impacto de auditoria. O Soft Delete preserva a integridade referencial do banco para investigações futuras e evita a perda acidental de dados. O Prisma foi estendido (via query default) para ocultar automaticamente os registros deletados das rotinas normais de busca.
