# Project Context

## Project Purpose

Personal finance management backend API. Provides user authentication, financial transaction tracking, wallet management, categorization, recurring transactions, debt tracking, financial goals, notifications, reports, and file uploads.

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22.x | Runtime |
| NestJS | 11.x | Application framework |
| TypeScript | 5.7.x | Language |
| TypeORM | 0.3.x | ORM / database access |
| PostgreSQL | (via `pg` 8.x) | Primary database |
| Passport / JWT | @nestjs/jwt 11.x | Authentication |
| class-validator | 0.14.x | DTO validation |
| class-transformer | 0.5.x | Serialization |
| BullMQ | 5.x (optional) | Job queue (configured but not actively used) |
| Redis / Keyv | @keyv/redis 5.x | Caching (optional, falls back to memory) |
| Multer | 2.4.x | File uploads |
| Swagger | @nestjs/swagger 11.x | API documentation |
| @nestjs/schedule | 6.x | Cron jobs |
| Socket.IO | @nestjs/websockets 11.x | WebSocket gateway (currently commented out) |
| LangChain | 0.3.x | AI/LLM integration (available, usage TBD) |
| OpenTelemetry | 0.222.x | Distributed tracing |
| SWC | 1.10.x | Fast TypeScript compilation |
| Jest | 29.x | Testing framework |
| pnpm | — | Package manager |

## Repository Structure

```
BE/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── common/                    # Shared infrastructure
│   │   ├── config/                # NestJS module wrappers (Postgres, JWT, Cache, etc.)
│   │   ├── constants/             # Shared constants
│   │   ├── controller/            # BaseCrudController factory
│   │   ├── database/              # TypeORM data source & migrations
│   │   ├── decorator/             # Custom decorators (Swagger, Pagination)
│   │   ├── dto/                   # Shared DTOs & interfaces
│   │   ├── environment/           # Config service, env validation, typed configs
│   │   ├── filter/                # Global exception filter
│   │   ├── global-entity/         # BaseEntity
│   │   ├── idempotency/           # Idempotency system (decorator, interceptor, service)
│   │   ├── interceptor/           # Response interceptor, OpenTelemetry
│   │   ├── middleware/            # Request logger
│   │   ├── pipe/                  # Validation pipe config
│   │   ├── service/               # BaseCrudService
│   │   └── util/                  # Utilities (bcrypt, decimal, OTP, query-builder)
│   ├── module/                    # Business modules
│   │   ├── account/               # User account registration & management
│   │   ├── auth/                  # Authentication (JWT, token storage, guards)
│   │   ├── financial/             # Financial domain (parent module)
│   │   │   ├── financial-category/
│   │   │   ├── financial-transaction/
│   │   │   ├── financial-wallet/
│   │   │   ├── financial-wallet-transfer/
│   │   │   ├── financial-goal/
│   │   │   ├── financial-recurring/
│   │   │   ├── financial-notification/
│   │   │   ├── financial-report/
│   │   │   ├── financial-dashboard/
│   │   │   ├── financial-record/
│   │   │   ├── financial-debt/
│   │   │   └── financial-setting/
│   │   ├── health-check/          # Health endpoint
│   │   ├── profile/               # User profile
│   │   ├── static-file/           # File upload & storage
│   │   └── system-information/    # Server system info
│   ├── database/                  # Database migrations
│   ├── gateway/                   # WebSocket gateway (currently disabled)
│   ├── service/                   # Standalone services
│   │   ├── information-server/    # Server boot info logger
│   │   └── seed/                  # Database seeder (stub)
│   └── telemetry/                 # OpenTelemetry dashboard
├── test/                          # E2E tests
├── scripts/                       # Code generation scripts
├── instrumentation.ts             # OpenTelemetry setup
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example / .env.local / .env.prod
```

## Application Entry Points

- **HTTP Server**: `src/main.ts` → bootstraps NestJS, sets up CORS, Swagger, global pipes/filters/interceptors
- **Root Module**: `src/app.module.ts` → imports all feature modules and infrastructure
- **API Prefix**: configurable via `API_PREFIX` env var (default: `api`)
- **Swagger UI**: available at `/api` path
- **WebSocket**: port 8000 (currently disabled in AppModule providers)

## Build, Dev & Test Commands

| Command | Description |
|---|---|
| `pnpm run build` | Build for production |
| `pnpm run start:dev:local` | Dev server with `.env.local` |
| `pnpm run start:dev:prod` | Dev server with `.env.prod` |
| `pnpm run lint` | ESLint with auto-fix |
| `pnpm run format` | Prettier formatting |
| `pnpm run test` | Unit tests (Jest) |
| `pnpm run test:e2e` | E2E tests |
| `pnpm run test:cov` | Test coverage |
| `pnpm run migration:generate <path>` | Generate TypeORM migration |
| `pnpm run migration:run` | Run pending migrations |
| `pnpm run gen` | Generate new resource scaffold |

## Naming Conventions

- **Modules**: PascalCase suffixed with `Module` (e.g., `FinancialTransactionModule`)
- **Controllers**: PascalCase suffixed with `Controller`
- **Services**: PascalCase suffixed with `Service`
- **Entities**: PascalCase suffixed with `Entity` (e.g., `FinancialTransactionEntity`)
- **DTOs**: `ModuleName_Action_Request` / `ModuleName_Action_Response` pattern
- **Enums**: UPPER_SNAKE_CASE values
- **Files**: kebab-case (e.g., `financial-transaction.controller.ts`)
- **Path alias**: `@/` → `src/`

## Key Documentation Links

- [Architecture](ARCHITECTURE.md)
- [Core Overview](core/CORE_OVERVIEW.md)
- [Module Index](modules/INDEX.md)
- [Decisions](DECISIONS.md)
