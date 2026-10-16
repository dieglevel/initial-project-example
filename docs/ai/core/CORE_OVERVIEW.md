# Core Overview

This document provides a concise reference for the shared infrastructure components that all modules depend on.

## 1. BaseEntity

**File**: `src/common/global-entity/base-entity.entity.ts`

Abstract entity providing standard columns for all database entities.

| Column | Type | Notes |
|---|---|---|
| `id` | `number` | Auto-generated identity PK |
| `createdAt` | `Date` | Auto-set on insert |
| `updatedAt` | `Date` | Auto-set on update |
| `deletedAt` | `Date?` | Soft-delete marker, `select: false` |

**Invariants**:
- All entities in the project extend `BaseEntity`.
- Uses `@PrimaryGeneratedColumn("identity")` (PostgreSQL identity column).
- Decorated with `@ApiEntity()` for automatic Swagger property generation.

**Regression risk**: Changing column names or types affects all entities and database schema.

---

## 2. BaseCrudService

**File**: `src/common/service/base-crud.service.ts`

Abstract generic service providing standard CRUD + pagination.

```typescript
abstract class BaseCrudService<T extends { id: number }> {
  constructor(protected readonly repository: Repository<T>) {}
  
  findAll(options?): Promise<T[]>         // Default order: createdAt DESC
  findOne(id, options?): Promise<T>       // Throws NotFoundException
  create(data, relations?): Promise<T>    // Supports relation shorthand { key: id }
  update(id, data): Promise<T>            // Fetch-then-save pattern
  delete(id): Promise<boolean>            // Soft-delete via softDelete()
  paging(pagination, options?): Promise<PaginatedResult>  // Search + pagination
}
```

**Key behaviors**:
- `findOne` throws `NotFoundException` if entity not found.
- `delete` uses `softDelete` (not `remove`/`delete`).
- `paging` accepts custom join relations via callback and dynamic search fields.
- Default ordering: `createdAt DESC`.

**Used by**: Most financial module services and any CRUD-heavy module.

**Regression risk**: Modifying `delete()` behavior affects all soft-delete behavior project-wide.

---

## 3. CreateGenericController Factory

**File**: `src/common/controller/base-crud.controller.ts`

Factory function that generates a base controller class with standard CRUD endpoints.

```typescript
function CreateGenericController<TEntity, TCreateDto, TUpdateDto>(options: {
  entity: Type<TEntity>;
  dto: { create: Type<TCreateDto>; update: Type<TUpdateDto> };
  responses: { getAll, create, paging, update, delete };
  excludeSearch?: (keyof TEntity)[];
}): BaseController
```

**Generated endpoints**:
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/all` | Get all entities for current user |
| `POST` | `/create` | Create entity with user relation |
| `GET` | `/paging` | Paginated listing with search |
| `POST` | `/update/:id` | Update entity (note: POST not PATCH) |
| `DELETE` | `/delete/:id` | Soft-delete entity |

**Conventions**:
- All endpoints require `@ApiBearerAuth("access-token")`.
- `getAll` and `create` scope to current user via `@CurrentUser()`.
- Controllers that extend this can override any method.

**Regression risk**: Changes affect all controllers using the factory (most financial modules).

---

## 4. AllExceptionsFilter

**File**: `src/common/filter/all-exception.filter.ts`

Global exception filter that normalizes all error responses.

**Handles**:
- `HttpException` → extract status/message
- `QueryFailedError` (TypeORM) → PostgreSQL error codes:
  - `23505` (unique violation) → 409 Conflict
  - `23503` (FK violation) → 400 Bad Request
  - `23502` (NOT NULL violation) → 400 Bad Request
- Generic `Error` → 500 Internal Server Error

**Response format**:
```json
{
  "path": "/api/...",
  "timeStamp": "2025-...",
  "statusCode": 409,
  "message": "email already exists"
}
```

**Note**: Suppresses stack trace logging for 401 Unauthorized.

---

## 5. ResponseInterceptor

**File**: `src/common/interceptor/response.interceptor.ts`

Wraps all successful responses in a standard envelope.

**Response format**:
```json
{
  "path": "/api/...",
  "timestamp": "2025-...",
  "statusCode": 200,
  "data": { ... }
}
```

---

## 6. ValidationPipe

**File**: `src/common/pipe/validation.pipe.ts`

Global validation pipe using `class-validator`.

- `transform: true` — auto-transforms query/body to DTO instances.
- Custom error factory formats errors as: `{ field, messages[] }`.
- Throws `BadRequestException` with `{ message: "Validation failed", errors: [...] }`.

---

## 7. Environment Configuration

**Files**: `src/common/environment/`

Uses `@nestjs/config` with Joi validation and typed `registerAs` config factories.

| Config Factory | Key | File | Main Values |
|---|---|---|---|
| `appConfig` | `appConfig` | `types/app.config.ts` | PORT, HOST, API_PREFIX, APP_URL, ROUTE_FOLDER, ROOT_UPLOAD_FOLDER |
| `databaseConfig` | `database` | `types/database.type.ts` | POSTGRES_HOST, PORT, USER, PASSWORD, DB, SYNC, DROP_SCHEMA |
| `jwtConfig` | `jwtConfig` | `types/jwt.type.ts` | JWT_SECRET, EXPIRATION_TIME, TOKEN_CACHE_MODE, TOKEN_STORE_DRIVER |
| `redisConfig` | `redisConfig` | `types/redis.type.ts` | REDIS_HOST, PORT, CACHE_PREFIX, BULL_PREFIX |

**Env validation**: `src/common/environment/valid-schema.ts` (Joi schema).

**Access pattern**: `@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>`.

---

## 8. Authentication System

**Files**: `src/module/auth/`

### Key Components

| File | Purpose |
|---|---|
| `jwt.guard.ts` | Global `CanActivate` guard, checks JWT + token storage |
| `auth.service.ts` | Sign-in, logout, refresh, token validation |
| `payload.type.ts` | `JwtPayload = { sub: number }` |
| `decorator/public.decorator.ts` | `@Public()` — skip auth |
| `decorator/current-user.decorator.ts` | `@CurrentUser()` — extract user from request |
| `storage/token-storage.interface.ts` | `IJwtTokenStorageService` interface |
| `storage/database-token-storage.service.ts` | DB-backed token storage |
| `storage/memory-token-storage.service.ts` | In-memory token storage |
| `storage/redis-token-storage.service.ts` | Redis-backed token storage |

### Token Storage Strategy

Configurable via `AUTH_TOKEN_STORE_DRIVER` env var:
- `"database"` → `DatabaseTokenStorageService`
- `"redis"` → `RedisTokenStorageService`
- `"memoryCache"` (default) → `MemoryTokenStorageService`

Token mode (`AUTH_ACCESS_TOKEN_CACHE_MODE`):
- `"whitelist"` (default): Only stored tokens are valid.
- `"blacklist"`: Tokens are valid unless explicitly blacklisted.

---

## 9. Idempotency System

**Files**: `src/common/idempotency/`

Database-backed idempotency for mutation endpoints.

| File | Purpose |
|---|---|
| `idempotency.decorator.ts` | `@UseIdempotency()` — marks route |
| `idempotency.interceptor.ts` | Intercepts request, checks/caches |
| `idempotency.service.ts` | Core logic with pessimistic locking |
| `_entities/idempotency.entity.ts` | DB entity for records |

**Flow**: Header `Idempotency-Key` → hash body → check DB → if new: process + cache; if duplicate: return cached response.

**Used by**: `FinancialTransactionController` (create, update, delete).

---

## 10. Pagination System

**Files**: `src/common/decorator/pagination/`

| File | Purpose |
|---|---|
| `pagination.decorator.ts` | `@Pagination()` param decorator + `PaginationQueryDto` |
| `api-pagination.decorator.ts` | `@ApiPagination()` Swagger docs |

**Query params**: `page`, `pageSize`, `search`, `searchFields[]`, `sort[N][field]`, `sort[N][order]`.

---

## 11. Swagger / API Documentation

**Files**: `src/common/decorator/api-swagger/`, `src/common/config/swagger/`

| Component | Purpose |
|---|---|
| `ApiBaseResponse(model, options)` | Standard response schema decorator |
| `ApiEntity()` | Auto-generates `@ApiProperty` for entity columns |
| `ApiUploadFile` decorator | File upload Swagger docs |
| `swagger.config.ts` | Swagger document builder |
| `swagger.css.ts` | Custom Swagger UI styles |

**NestJS Swagger Plugin** enabled in `nest-cli.json` — auto-infers DTO properties from TypeScript types.

---

## 12. Shared Utilities

| File | Exports | Purpose |
|---|---|---|
| `src/common/util/bcrypt.util.ts` | `hashPassword`, `comparePassword` | Password hashing (salt=10) |
| `src/common/util/decimal-transformer.ts` | `DecimalTransformer` | TypeORM string→number for decimal columns |
| `src/common/util/otp-generate.ts` | — | OTP generation utility |
| `src/common/util/query-builder.util.ts` | `col`, `eq`, `alias` | TypeORM query builder helpers |

---

## 13. File Storage System

**Files**: `src/module/static-file/`

- **Adapter pattern**: `FileStorageAdapter` interface → `LocalDiskAdapter` implementation.
- **Temporary files**: All uploads are `isTemporary: true` initially.
- **Cleanup cron**: `FileCleanupCron` runs daily at midnight, deletes temp files older than 24h.
- **Permanent marking**: `StaticFileService.markAsPermanent(id)` — called by consuming modules.
- **Static serving**: Files served via `ServeStaticModule` at `/{ROUTE_FOLDER}/` path.

---

## 14. Cron Jobs

| Cron | Schedule | File |
|---|---|---|
| `FileCleanupCron` | Daily at midnight | `src/module/static-file/clean-temp-file.cron.ts` |
| `FinancialRecurringCron` | Every hour | `src/module/financial/financial-recurring/financial-recurring.cron.ts` |
| `FinancialGoalCron` | (check source) | `src/module/financial/financial-goal/financial.goal.cron.ts` |
| `FinancialNotificationCron` | (check source) | `src/module/financial/financial-notification/financial-notification.cron.ts` |

---

## 15. Infrastructure Modules

| Module | File | Purpose |
|---|---|---|
| `InitialConfigServiceModule` | `src/common/environment/config-service.module.ts` | Global config with Joi validation |
| `InitialPostgresModule` | `src/common/config/postgres.database.module.ts` | TypeORM + PostgreSQL |
| `InitialJwtModule` | `src/common/config/jwt.module.ts` | Global JWT (HS256) |
| `InitialCacheManagerModule` | `src/common/config/cache-manager.module.ts` | Redis or in-memory cache |
| `InitialServeStaticModule` | `src/common/config/serve-static.module.ts` | Static file serving |
| `InitialScheduleModule` | `src/common/config/schedule.module.ts` | @nestjs/schedule root |

## Documentation Status

- Status: Verified
- Last Verified: 2026-10-16
- Source Paths: All files listed above
- Known Gaps:
  - `BullMQ` module (`src/common/config/bullMQ.module.ts`) exists but is not imported in `AppModule` — usage unclear.
  - WebSocket gateway exists in source but is commented out in `AppModule.providers`.
  - LangChain dependencies present but usage not traced in detail.
