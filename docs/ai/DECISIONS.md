# Architectural Decisions Log

This document records architectural and design decisions that are verified from existing documentation, repository configurations, or established source code patterns.

---

## ADR-001: Monolithic NestJS Architecture with Modular Domain Organization

- **Status**: Accepted
- **Context**: The project is a personal finance management backend supporting user accounts, transaction tracking, reporting, and automated financial tasks.
- **Decision**: Structure the application as a modular NestJS monolith. The `src/` directory is partitioned into `common/` (cross-cutting utilities, base classes, filters, interceptors) and `module/` (feature modules including `auth`, `account`, `profile`, `static-file`, and domain-specific `financial/` submodules).
- **Rationale**: A modular monolith simplifies deployment, transaction management across financial entities, and code sharing while maintaining clear bounded contexts.
- **Consequences**: Fast local development and unified CI/CD; requires discipline around cross-module imports to avoid circular dependencies.
- **Evidence / Source Paths**:
  - `src/app.module.ts`
  - `src/module/financial/financial.module.ts`
  - `package.json`

---

## ADR-002: BaseEntity with Soft Deletion and Audit Trails

- **Status**: Accepted
- **Context**: Financial records, accounts, and user data require auditability and accidental deletion protection.
- **Decision**: All persistent TypeORM entities must inherit from `BaseEntity`. This provides `id` (bigint generated), `created_at`, `updated_at`, `deleted_at` (soft delete via TypeORM `@DeleteDateColumn`), and audit user fields `created_by`, `updated_by`, and `deleted_by`.
- **Rationale**: Guarantees consistent audit columns across all tables and prevents destructive data loss by defaulting to soft deletes.
- **Consequences**: Queries must be conscious of soft-deleted records (TypeORM automatically filters unless `withDeleted` is specified).
- **Evidence / Source Paths**:
  - `src/common/global-entity/base-entity.entity.ts`

---

## ADR-003: Generic CRUD Architecture via BaseCrudService and CreateGenericController

- **Status**: Accepted
- **Context**: Many domain entities (categories, wallets, goals, debts, settings) require standard CRUD operations, pagination, filtering, and sorting.
- **Decision**: Implement a reusable generic abstraction: `BaseCrudService<T>` handles querying, pagination, soft deletion, and lifecycle hooks (`beforeCreate`, `afterCreate`, etc.), while `CreateGenericController()` generates standard REST endpoints (`/paging`, `/`, `/:id`).
- **Rationale**: Eliminates repetitive boilerplate across 10+ financial entities while allowing custom overrides via class inheritance.
- **Consequences**: New developers/agents must learn the factory controller pattern rather than writing raw controller methods; custom route logic requires careful hook overrides or dedicated route handlers.
- **Evidence / Source Paths**:
  - `src/common/service/base-crud.service.ts`
  - `src/common/controller/base-crud.controller.ts`
  - `src/common/controller/generic-controller-options.ts`

---

## ADR-004: Standardized Global API Envelope and Exception Handling

- **Status**: Accepted
- **Context**: API clients (mobile, web) expect a predictable response structure for both successful responses and error states.
- **Decision**: Use a global `ResponseInterceptor` to wrap all successful HTTP responses in `{ statusCode, message, data, timestamp }`. Use a global `AllExceptionsFilter` to catch and normalize HTTP and unhandled exceptions into `{ statusCode, message, error, timestamp, path }`.
- **Rationale**: Consistent client-side deserialization, error parsing, and unified logging.
- **Consequences**: Controller methods return raw payload objects; interceptor handles wrapping. Custom non-wrapped responses require bypassing the interceptor.
- **Evidence / Source Paths**:
  - `src/common/interceptor/response.interceptor.ts`
  - `src/common/filter/all-exception.filter.ts`
  - `src/common/dto/interface/success-response.interface.ts`
  - `src/common/dto/interface/error-response.interface.ts`

---

## ADR-005: Dual-Token JWT Authentication with Multi-Device Session Storage

- **Status**: Accepted
- **Context**: Secure user authentication across multiple client devices (e.g., mobile app, web dashboard) with token rotation.
- **Decision**: Implement JWT-based authentication using short-lived Access Tokens and longer-lived Refresh Tokens. Refresh tokens are tracked via a pluggable `TokenStorageService` supporting Redis (or in-memory fallback), keyed per user and device identifier (`user_agent` / `device_id`).
- **Rationale**: Prevents compromised refresh tokens from persisting indefinitely; allows targeted single-device logout or global multi-device logout.
- **Consequences**: Redis is required in production for shared session state across cluster instances.
- **Evidence / Source Paths**:
  - `src/module/auth/auth.service.ts`
  - `src/module/auth/guard/auth.guard.ts`
  - `src/module/auth/storage/token-storage.interface.ts`
  - `src/module/auth/storage/redis-token-storage.service.ts`

---

## ADR-006: Client-Driven Idempotency for Critical Mutation Endpoints

- **Status**: Accepted
- **Context**: Network retries or double-submissions on financial transactions can lead to duplicate charges or incorrect wallet balances.
- **Decision**: Provide an idempotency mechanism using an `IdempotencyInterceptor` and `@UseIdempotency()` decorator requiring clients to pass an `Idempotency-Key: <uuid>` header on transaction creation, update, and deletion endpoints. Cached responses are retained in Redis/CacheManager.
- **Rationale**: Protects financial data integrity against duplicate requests without forcing complex client-side reconciliation.
- **Consequences**: API clients must generate and track UUID v4 idempotency keys for mutations.
- **Evidence / Source Paths**:
  - `src/common/idempotency/idempotency.interceptor.ts`
  - `src/common/idempotency/idempotency.decorator.ts`
  - `src/common/idempotency/idempotency.service.ts`
  - `src/module/financial/financial-transaction/financial-transaction.controller.ts`

---

## ADR-007: Pluggable Storage Adapters for Uploaded Static Files

- **Status**: Accepted
- **Context**: File uploads (transaction receipts, user avatars, debt attachments) need flexible storage destinations (local disk in dev/small deployments, object storage for scale).
- **Decision**: Define an `IStorageAdapter` interface with a `LocalDiskAdapter` implementation. Track all uploaded files in a `FileEntity` database table with status (`TEMP`, `ACTIVE`, `DELETED`) and auto-delete uncommitted temporary files via a scheduled cron job (`FileCleanupCron`).
- **Rationale**: Decouples business logic from disk/cloud storage semantics and prevents orphaned files from exhausting server disk space.
- **Consequences**: Upload is a two-phase process: file is initially `TEMP`, then confirmed `ACTIVE` when linked to an entity (e.g., Profile or Transaction receipt).
- **Evidence / Source Paths**:
  - `src/module/static-file/storage/adapter/storage.adapter.interface.ts`
  - `src/module/static-file/storage/service/local-disk.adapter.ts`
  - `src/module/static-file/clean-temp-file.cron.ts`
  - `src/module/static-file/_entities/file.entity.ts`

---

## ADR-008: DecimalTransformer for Database Numeric Precision

- **Status**: Accepted
- **Context**: PostgreSQL `numeric` / `decimal` columns are returned by `pg` / `TypeORM` as strings to prevent JavaScript floating-point precision loss.
- **Decision**: Use a custom TypeORM `DecimalTransformer` that parses database numeric strings to JavaScript floats/numbers upon hydration and formats them for persistence.
- **Rationale**: Simplifies calculation logic in services without requiring manual conversions at every query site.
- **Consequences**: Calculations must be mindful of JS IEEE-754 limits for extremely large values, or use decimal math libraries if precision beyond double precision is required.
- **Evidence / Source Paths**:
  - `src/common/util/decimal-transformer.ts`
  - `src/module/financial/financial-transaction/_entities/financial-transaction.entity.ts`
