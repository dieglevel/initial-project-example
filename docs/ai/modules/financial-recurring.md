# Module: Financial Recurring

## Purpose
Automates recurring income and expense transactions (e.g., subscriptions, rent, salary, loan payments) using configurable schedules, supporting both automated transaction creation and reminder-only modes.

## Responsibilities and Boundaries
- CRUD management for recurring schedules (`FinancialRecurringEntity`).
- Periodic background execution via `FinancialRecurringCron` every hour.
- Automated creation of ledger transactions (`FinancialTransactionEntity`) or notifications when due.
- Manual ad-hoc execution trigger via `POST /financial-recurring/run-due`.
- Advancing next execution timestamp (`nextRunAt`) based on interval and frequency.

## Source Map
```
src/module/financial/financial-recurring/
├── financial-recurring.controller.ts     # Controller extending CreateGenericController
├── financial-recurring.service.ts        # Execution engine & rule scheduling
├── financial-recurring.module.ts         # Module definition
├── financial-recurring.enum.ts           # FREQUENCY, TYPE
├── financial-recurring.cron.ts           # Hourly cron schedule (EVERY_HOUR)
├── _entities/
│   └── financial-recurring.entity.ts     # TypeORM entity
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    ├── delete.dto.ts
    └── run-due.dto.ts
```

## Main Components
- **`FinancialRecurringEntity`**: Stores schedule details (frequency, nextRunAt, lastRunAt, amount, walletId, categoryId, reminderOnly, isAutoCreate).
- **`FinancialRecurringCron`**: Hourly background scheduler executing `runDueForAllAccounts()`.
- **`FinancialRecurringService`**: Evaluates due rules, generates transactions, creates notifications, and updates `nextRunAt`.
- **`FinancialRecurringController`**: Standard generic CRUD plus `POST /run-due`.

## Business and Data Flows
1. User defines recurring rule: specifies frequency (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `CUSTOM`), amount, wallet, and category.
2. Hourly cron triggers `runDueForAllAccounts()`.
3. If `isAutoCreate = true`:
   - Creates a new `FinancialTransactionEntity`.
   - Adjusts the associated wallet balance.
4. If `reminderOnly = true`:
   - Creates an alert in `FinancialNotificationEntity`.
5. Updates `lastRunAt = now()` and calculates new `nextRunAt`.

## Data Model and Relationships
- Belongs to `AccountEntity` via `accountId` (onDelete: CASCADE).
- References `FinancialWalletEntity` via `walletId` (onDelete: CASCADE).
- References `FinancialCategoryEntity` via `categoryId` (onDelete: SET NULL).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`.
- **Domain**: `FinancialTransactionModule`, `FinancialWalletModule`, `FinancialNotificationModule`, `AccountModule`.

## Existing Patterns and Conventions
- Uses `CronExpression.EVERY_HOUR` from `@nestjs/schedule`.
- Extends `BaseCrudService` for common querying and validation.

## Extension Guide
- To support end-of-series dates or execution limits, add `endDate` or `remainingExecutions` fields to `FinancialRecurringEntity`.

## Constraints and Common Pitfalls
- Execution must be idempotent to avoid creating duplicate transactions if a cron run overlaps or retries.
- Always check that the target wallet still exists before inserting transactions.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify schedules and types.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-recurring/financial-recurring.controller.ts`
  - `src/module/financial/financial-recurring/financial-recurring.service.ts`
  - `src/module/financial/financial-recurring/financial-recurring.cron.ts`
  - `src/module/financial/financial-recurring/_entities/financial-recurring.entity.ts`
- Known Gaps: None.
