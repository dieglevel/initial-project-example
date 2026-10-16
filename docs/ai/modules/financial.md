# Module: Financial (Parent Domain)

## Purpose
The `FinancialModule` serves as the aggregate root module for all personal finance subdomains. It coordinates imports and exposes the financial boundaries within the application.

## Responsibilities and Boundaries
- Imports and binds all 12 financial submodules into the root NestJS dependency graph.
- Defines no standalone controllers or entities of its own; acts strictly as an aggregator and domain umbrella.
- External callers access financial features via specific submodule REST controllers.

## Source Map
```
src/module/financial/
├── financial.module.ts             # Aggregate module definition
├── financial-category/             # Income & expense categories
├── financial-wallet/               # Multi-wallet and account management
├── financial-transaction/          # Core ledger transactions & items
├── financial-wallet-transfer/      # Inter-wallet transfers
├── financial-goal/                 # Savings targets and progress tracking
├── financial-recurring/            # Scheduled and recurring transactions
├── financial-notification/         # Financial alert and notification engine
├── financial-report/               # Cash-flow, net-worth, and spending reports
├── financial-dashboard/            # Consolidated dashboard summaries
├── financial-record/               # Automated bank notification ingestion
├── financial-debt/                 # Debt and loan tracking
└── financial-setting/              # Per-user financial preferences
```

## Main Components
- **`FinancialModule`** (`src/module/financial/financial.module.ts`): NestJS module importing all financial submodules.

## Business and Data Flows
- User requests enter through submodule-specific controllers (e.g., `financial-transaction`, `financial-wallet`).
- Cross-domain interactions occur through service injection or database foreign keys tied to the user's `account.id`.
- Background tasks (cron jobs in `financial-recurring`, `financial-goal`, `financial-notification`) execute periodically to process scheduled events.

## Data Model and Relationships
All financial domain entities relate back to `AccountEntity` via foreign key `accountId` and inherit common audit columns from `BaseEntity`.

```
                    ┌─────────────────┐
                    │  AccountEntity  │
                    └────────┬────────┘
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│Financial     │      │Financial     │     │Financial     │
│CategoryEntity│      │WalletEntity  │     │GoalEntity    │
└───────┬──────┘      └──────┬───────┘     └──────────────┘
        │                    │
        └─────────┬──────────┘
                  ▼
       ┌─────────────────────┐
       │FinancialTransaction │
       │Entity & Items       │
       └─────────────────────┘
```

## Dependencies and Integrations
- **Core Dependencies**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`, `IdempotencyInterceptor`.
- **Module Dependencies**: `AccountModule`, `AuthModule`.

## Existing Patterns and Conventions
- Every submodule contains `_entities/`, `dto/`, a service, a controller, and an enum definition file.
- CRUD submodules extend `BaseCrudService` and inherit controller endpoints using `CreateGenericController`.

## Extension Guide
- When adding a new financial feature, create a new subfolder under `src/module/financial/<new-feature>/` and register its module in `FinancialModule.imports`.
- Ensure new entities extend `BaseEntity` and maintain relation to `AccountEntity`.

## Constraints and Common Pitfalls
- Do not add cross-submodule circular dependencies. When one submodule needs another, import the required module or decouple via event/messaging.
- Ensure all mutations filter by the authenticated user's `accountId` via `@CurrentUser()`.

## Tests and Verification
- Run `pnpm run build` to verify module wiring and compilation.
- Submodule unit tests reside in `<submodule>.service.spec.ts`.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial.module.ts`
- Known Gaps: None.
