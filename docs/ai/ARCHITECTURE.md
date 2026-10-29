# Architecture

## System Overview

A monolithic NestJS backend API for personal finance management. Single PostgreSQL database, JWT-based authentication, optional Redis caching, and file-based storage.

```
┌─────────────┐     ┌─────────────────────────────────────────────────┐
│   Client     │───▶│  NestJS Application (HTTP + optional WS)        │
│   (FE App)   │◀───│                                                 │
└─────────────┘     │  ┌────────────────────────────────────────────┐ │
                    │  │ Global Middleware & Interceptors           │ │
                    │  │  • LoggerMiddleware (request logging)      │ │
                    │  │  • ResponseInterceptor (wrap responses)    │ │
                    │  │  • AllExceptionsFilter (error handling)    │ │
                    │  │  • ValidationPipe (DTO validation)         │ │
                    │  │  • AuthGuard (JWT, global)                 │ │
                    │  │  • ClassSerializerInterceptor              │ │
                    │  │  • OpenTelemetryInterceptor                │ │
                    │  └────────────────────────────────────────────┘ │
                    │                                                 │
                    │  ┌────────────────────────────────────────────┐ │
                    │  │ Feature Modules                            │ │
                    │  │  • Auth (sign-in, token management)        │ │
                    │  │  • Account (registration, password)        │ │
                    │  │  • Profile (user profile)                  │ │
                    │  │  • Financial (12 sub-modules)              │ │
                    │  │  • Static File (upload/storage)            │ │
                    │  │  • Health Check                            │ │
                    │  │  • System Information                      │ │
                    │  │  • Telemetry (OTel dashboard)              │ │
                    │  └────────────────────────────────────────────┘ │
                    │                                                 │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
                    │  │PostgreSQL│  │  Redis   │  │  File System │   │
                    │  │ (TypeORM)│  │(optional)│  │ (local disk) │   │
                    │  └──────────┘  └──────────┘  └──────────────┘   │
                    └─────────────────────────────────────────────────┘
```

## Module Dependency Map

```
AppModule
├── InitialConfigServiceModule     (global config, env validation)
├── InitialPostgresModule          (TypeORM + PostgreSQL connection)
├── InitialJwtModule               (global JWT signing/verification)
├── InitialCacheManagerModule      (Redis or in-memory cache)
├── InitialServeStaticModule       (serve uploaded files)
├── InitialScheduleModule          (cron job scheduler)
│
├── AuthModule                     (depends on: AccountModule)
├── AccountModule                  (depends on: Profile entity)
├── ProfileModule                  (depends on: Account entity, File entity)
├── StaticFileModule               (standalone, file upload/storage)
│
├── FinancialModule
│   ├── FinancialSettingModule     (per-user financial settings)
│   ├── FinancialCategoryModule   (income/expense categories, hierarchical)
│   ├── FinancialWalletModule     (wallets/accounts)
│   ├── FinancialWalletTransferModule (inter-wallet transfers)
│   ├── FinancialTransactionModule (transactions with idempotency)
│   ├── FinancialGoalModule       (savings goals with cron)
│   ├── FinancialRecurringModule  (recurring transactions with cron)
│   ├── FinancialNotificationModule (smart alerts with cron)
│   ├── FinancialReportModule     (analytics/reports, no entities)
│   ├── FinancialDashboardModule  (dashboard aggregations, no entities)
│   ├── FinancialRecordModule     (bank transaction ingestion)
│   └── FinancialDebtModule       (debt tracking)
│
├── HealthCheckModule              (standalone)
├── SystemInformationModule        (system metrics)
└── TelemetryModule                (OpenTelemetry dashboard)
```

## Request Flow

1. **Client** sends HTTP request.
2. **LoggerMiddleware** logs `METHOD URL [STATUS] - TIME ms`.
3. **AuthGuard** (global) checks JWT — skips routes marked `@Public()`.
4. **ValidationPipe** validates request body/params against DTO class-validator rules.
5. **Controller** handles the route, delegates to **Service**.
6. **Service** interacts with **Repository** (TypeORM) for data operations.
7. **ResponseInterceptor** wraps successful responses: `{ path, timestamp, statusCode, data }`.
8. **AllExceptionsFilter** catches errors and returns: `{ path, timeStamp, statusCode, message }`.
9. **ClassSerializerInterceptor** applies `@Exclude()` / `@Expose()` transformations.

## Authentication Architecture

- **Strategy**: JWT Bearer tokens (HS256)
- **Guard**: Global `AuthGuard` applied via `APP_GUARD`
- **Public routes**: Decorated with `@Public()` (sets `isPublic` metadata)
- **Token modes**: Configurable whitelist (default) or blacklist
- **Token storage**: Pluggable via `TOKEN_STORAGE_SERVICE` — supports Database, Redis, or Memory
- **Multi-device**: Each device gets its own access + refresh token pair
- **Token payload**: `{ sub: number }` (account ID)

## Data Model (Entity Relationships)

```
AccountEntity (1)
├── (1:1) ProfileEntity → (1:1?) FileEntity (avatar)
├── (1:1?) FinancialSettingEntity
├── (1:N) FinancialCategoryEntity → (self-ref) parent/children hierarchy
│                                 └── (1:N) FinancialTransactionItemEntity
├── (1:N) FinancialWalletEntity → (1:N) FinancialTransactionEntity
│                               │       └── (1:N) FinancialTransactionItemEntity
│                               └── (1:N) FinancialWalletTransferEntity (source/dest)
├── (1:N) FinancialGoalEntity → (1:N) FinancialGoalHistoryEntity
├── (1:N) FinancialRecurringEntity
├── (1:N) FinancialNotificationEntity
├── (1:N) FinancialDebtEntity → (1:N) FinancialDebtHistoryEntity
└── (1:N) FinancialRecordEntity
```

- All entities extend `BaseEntity` (id, createdAt, updatedAt, deletedAt).
- Soft-delete is the default pattern (via `DeleteDateColumn`).
- Decimal columns use `DecimalTransformer` for string→number conversion.

## Persistence

- **Database**: PostgreSQL with SSL (`rejectUnauthorized: false`).
- **ORM**: TypeORM with `autoLoadEntities: true`.
- **Migrations**: Located in `src/common/database/migrations/` and `src/database/migrations/`.
- **Synchronize**: Disabled in production (commented out).
- **Transactions**: Used in Account registration, file uploads, idempotency checks.

## Cross-Cutting Concerns

| Concern | Implementation | Location |
|---|---|---|
| Authentication | JWT global guard | `src/module/auth/jwt.guard.ts` |
| Authorization | User scoping via `@CurrentUser()` | Per-controller |
| Validation | class-validator + global ValidationPipe | `src/common/pipe/validation.pipe.ts` |
| Error Handling | AllExceptionsFilter (HTTP, TypeORM, generic) | `src/common/filter/all-exception.filter.ts` |
| Response Wrapping | ResponseInterceptor | `src/common/interceptor/response.interceptor.ts` |
| Logging | LoggerMiddleware (request), NestJS Logger (app) | `src/common/middleware/log.middleware.ts` |
| Caching | CacheManager (Redis/Memory, configurable) | `src/common/config/cache-manager.module.ts` |
| Idempotency | Decorator + Interceptor + DB-backed service | `src/common/idempotency/` |
| Observability | OpenTelemetry instrumentation | `instrumentation.ts`, `src/telemetry/` |
| Cron Jobs | @nestjs/schedule (file cleanup, recurring tx, goals, notifications) | Per-module `.cron.ts` files |
| File Storage | Adapter pattern (currently: LocalDisk) | `src/module/static-file/storage/` |
| API Docs | Swagger auto-generation with plugin | `nest-cli.json`, `src/common/config/swagger/` |

## Architectural Constraints

1. **All routes are authenticated by default.** Use `@Public()` to opt out.
2. **All responses are wrapped** in `{ path, timestamp, statusCode, data }`.
3. **All entities must extend BaseEntity** for consistent id/timestamps/soft-delete.
4. **Soft-delete by default** — `BaseCrudService.delete()` uses `softDelete`.
5. **Pagination** uses query-string parameters parsed by the `@Pagination()` decorator.
6. **Financial mutations use idempotency** — `@()` + `IdempotencyInterceptor`.
7. **File uploads are marked as temporary** and cleaned up after 24h by `FileCleanupCron` unless explicitly marked permanent.
