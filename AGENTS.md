# AGENTS.md — Shared AI Agent Instructions

> This file provides universal instructions for all AI coding agents (Claude Code, Codex, Cursor, etc.) working on this NestJS backend repository.

## 1. Context Loading Workflow

### At the start of a task

1. Read this file (`AGENTS.md`).
2. Read `SESSION_LOG.md` for the latest working state.
3. Read `docs/ai/PROJECT_CONTEXT.md` for project overview.
4. Locate the relevant module via `docs/ai/modules/INDEX.md`.
5. Read the module documentation and `docs/ai/core/CORE_OVERVIEW.md` when relevant.
6. Inspect referenced source files and their imports.
7. **Search the codebase before creating new abstractions.** The project has established base classes, decorators, and utilities — use them.
8. Expand investigation only when the task requires it or when docs conflict with source.

### During implementation

1. Follow existing conventions and module boundaries (see Section 3).
2. Protect unrelated work — avoid unnecessary changes to files outside your scope.
3. Verify assumptions against actual source code.
4. Run `pnpm run build` and `pnpm run lint` to check your changes.
5. Record important discoveries and decisions.

### At the end of a task

1. Review the source changes (`git diff`).
2. Run verification: `pnpm run build`, `pnpm run lint`, `pnpm run test` (if applicable).
3. Update documentation affected by meaningful changes.
4. Update `SESSION_LOG.md` with the current state and next steps.
5. Append a concise entry to `SESSION_HISTORY.md` for completed work.
6. Report changed files, verification results, and unresolved issues.

## 2. Source of Truth

- **Source code is the source of truth.** Documentation is a derived representation.
- If documentation conflicts with code, verify the implementation and update the docs.
- Do not claim tests/builds passed unless they were actually executed.
- Do not invent architectural patterns, business rules, or module relationships.

## 3. Coding Conventions

### File Naming
- Entities: `<name>.entity.ts` in `_entities/` subdirectory
- DTOs: `<action>.dto.ts` in `dto/` subdirectory
- Controllers: `<module>.controller.ts`
- Services: `<module>.service.ts`
- Modules: `<module>.module.ts`
- Enums: `<module>.enum.ts`
- Cron jobs: `<module>.cron.ts`

### Architecture Patterns
- All entities extend `BaseEntity` from `src/common/global-entity/base-entity.entity.ts`
- CRUD services extend `BaseCrudService<T>` from `src/common/service/base-crud.service.ts`
- CRUD controllers use `CreateGenericController()` factory from `src/common/controller/base-crud.controller.ts`
- Path alias: `@/` maps to `src/`
- TypeORM for persistence; PostgreSQL as the database
- Global response wrapping via `ResponseInterceptor`
- Global exception handling via `AllExceptionsFilter`
- Global JWT auth guard; use `@Public()` decorator for unauthenticated routes
- Use `@CurrentUser()` decorator to extract `JwtPayload` (contains `sub: number`)

### DTO Conventions
- Use `class-validator` decorators for validation
- Use `class-transformer` for serialization
- Response DTOs are separate from request DTOs
- Naming pattern: `ModuleName_Action_Request` / `ModuleName_Action_Response`

### Testing
- Jest for unit tests; spec files co-located with source: `*.spec.ts`
- E2E tests in `test/` directory with `jest-e2e.json` config

## 4. Core Source Protection Policy

1. **Reuse existing abstractions** — `BaseCrudService`, `CreateGenericController`, `BaseEntity`, shared decorators, shared DTOs.
2. **Search before creating** — look for existing base classes, utilities, services, shared types, and decorators.
3. **Prefer extension points** — extend modules through established patterns rather than modifying shared core.
4. **Do not modify core source** merely to make an isolated feature easier.
5. **When core modification is needed**, identify: the reason, affected consumers, compatibility implications, regression risks, and the smallest viable change.
6. **Preserve existing contracts** unless the task explicitly requires a change.
7. **Update docs** when verified core behavior changes.
8. A justified architectural correction is acceptable — this is not an absolute ban.

### Core files requiring extra caution:
- `src/common/service/base-crud.service.ts`
- `src/common/controller/base-crud.controller.ts`
- `src/common/global-entity/base-entity.entity.ts`
- `src/common/filter/all-exception.filter.ts`
- `src/common/interceptor/response.interceptor.ts`
- `src/common/pipe/validation.pipe.ts`
- `src/common/environment/` (all config/env files)
- `src/module/auth/` (auth guard, JWT, token storage)

## 5. Module Documentation

- Module docs are in `docs/ai/modules/`.
- Use `docs/ai/modules/INDEX.md` to find the relevant doc.
- Read only the modules relevant to your task — avoid loading unnecessary context.
- When you modify a module's behavior or add features, update its documentation.

## 6. Session Logging

- `SESSION_LOG.md` — current session state, work in progress, immediate next steps.
- `SESSION_HISTORY.md` — chronological log of completed tasks.
- Keep entries concise. Don't copy entire conversations.
- Don't mark work as completed unless it was verified.

## 7. Git Safety & Secrets

- Check `git status` before making changes.
- Do not overwrite or revert pre-existing uncommitted work.
- **Never** include credentials, API keys, passwords, tokens, or private data in documentation or source commits.
- Use `.env.*` files for secrets (they are in `.gitignore`).

## 8. Documentation References

| Document | Path | Purpose |
|---|---|---|
| Project Context | `docs/ai/PROJECT_CONTEXT.md` | Tech stack, entry points, commands |
| Architecture | `docs/ai/ARCHITECTURE.md` | System design, module relationships |
| Core Overview | `docs/ai/core/CORE_OVERVIEW.md` | Shared infrastructure reference |
| Module Index | `docs/ai/modules/INDEX.md` | Find module documentation |
| Decisions | `docs/ai/DECISIONS.md` | Architectural decisions log |
| Session Log | `SESSION_LOG.md` | Current working state |
| Session History | `SESSION_HISTORY.md` | Completed work log |
