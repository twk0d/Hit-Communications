# AGENTS.md

## Repository Expectations

- This project is a technical test for HIT Communications: a NestJS + TypeScript REST API for operational incident management.
- Follow the architectural decisions documented in `docs/`.
- Keep implementation aligned with Clean Architecture, pragmatic DDD, and feature modules.
- Treat the `docs/` folder as the source of truth for product, architecture, validation, history, and testing decisions.
- Use npm as the package manager.

## Review Guidelines

- For local review requests, also read `.codex/code-standards.md` and `.codex/local-review-prompt.md` when the user references them.
- Prioritize correctness, architectural violations, security risks, missing tests, and behavior regressions.
- Flag only actionable findings. Avoid style-only comments unless they hide a maintainability or correctness issue.
- Use severity:
  - `P0`: critical blocker, security exposure, data loss, or broken core behavior.
  - `P1`: must fix before merge.
  - `P2`: should fix, but not necessarily merge-blocking.
  - `P3`: minor improvement.
- Do not approve changes that bypass the agreed architecture.
- Do not approve changes that bypass pragmatic DDD decisions.
- Do not approve use cases importing Prisma, Nest HTTP objects, controllers, environment variables, or infrastructure details directly.
- Do not approve domain/core code depending on framework-specific decorators or persistence models.
- Do not approve controllers containing business rules that belong in use cases.
- Do not approve transactional write flows that bypass the Unit of Work abstraction.
- Do not approve domain entities with unrestricted public mutation instead of explicit domain methods.
- Do not approve aggregates that expose persistence models or transport DTOs.
- Do not approve Value Objects without a real domain rule or clarity benefit.
- Do not approve Domain Services used only for application orchestration.
- Do not approve command/query responsibility mixing when the change is meant to follow CQRS.
- Do not approve incident updates that generate history outside the same Prisma transaction as the updated incident.
- Do not approve mandatory incident history implemented through asynchronous event handlers.
- Do not approve generic incident updates that allow setting `status` to `RESOLVED`; resolution must happen through the dedicated resolve use case/endpoint.
- Do not approve default queries that return soft-deleted records.
- Do not approve protected endpoints without JWT enforcement, except public `POST /api/v1/auth/register` and `POST /api/v1/auth/login`.
- Do not approve password hashing with bcrypt or plain hashes; this project uses Argon2id.
- Do not approve refresh token work in the MVP unless the project documentation is updated first.
- Do not approve new API routes that are not versioned under `/api/v1`.
- Do not approve validation behavior that fails to return the agreed `422` error shape for invalid input.
- Do not approve changes that miss tests for affected use cases, especially incident creation, update, resolution, filtering, and history generation.
- Do not approve broad refactors unrelated to the changed behavior.

## Project Architecture Rules

- Domain/application layers define use cases, entities, value objects, repository interfaces, and domain errors.
- `Incident` and `User` are aggregate roots.
- `IncidentHistory` is an audit record associated with `Incident`, not the owner of the incident lifecycle.
- Infrastructure implements repository interfaces using Prisma.
- Use cases depend on abstractions, not Prisma Client or Nest providers directly.
- Controllers map HTTP input/output and delegate to use cases.
- Zod schemas validate request params, query strings, and bodies through the global validation pipe.
- Prisma transactions should be owned by the infrastructure boundary or an explicit transaction abstraction, never leaked into controller logic.

## Business Rules To Protect

- Incidents use UUID identifiers.
- Users use UUID identifiers.
- Domain entities should keep state private and expose domain methods for mutation.
- Aggregates should protect invariants and stay free from Prisma, Nest, DTOs, and Zod schemas.
- `responsavel` is modeled as `User`; incidents reference it through `assigneeId`.
- All authenticated users can list all incidents.
- Listing incidents must support filtering by `assigneeId`.
- Incident categories are enum values: `SYSTEM`, `NETWORK`, `INFRASTRUCTURE`, `ACCESS`, `DATA`, `PROCESS`.
- Incident status values are `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CANCELED`.
- Incident priority values are `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Resolving an already resolved incident returns `422`.
- Removable records use soft delete with `deletedAt`.
- Default queries ignore records with `deletedAt` filled.
- Dates are stored in UTC and exposed as ISO 8601.
- Passwords are hashed with Argon2id.
- JWT uses access tokens only in the MVP.
- The dedicated resolve flow sets `status = RESOLVED` and fills `resolvedAt` automatically.
- Incident history records `incidentId`, `field`, `oldValue`, `newValue`, `changedById`, and `changedAt`.

## Verification Expectations

- Prefer focused unit tests for use cases.
- Add or update e2e tests when HTTP behavior, auth, validation, filters, or persistence integration changes.
- For review automation, require at least lint, unit tests, build, and relevant e2e tests before merge.
