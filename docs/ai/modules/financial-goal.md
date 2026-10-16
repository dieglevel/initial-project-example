# Module: Financial Goal

## Purpose
Manages user savings and financial targets, tracking accumulated amounts against target deadlines, supporting manual/automatic contributions, projection timelines, and contribution history logs.

## Responsibilities and Boundaries
- CRUD operations for savings goals (`FinancialGoalEntity`).
- Track progress (`targetAmount` vs `currentAmount`) and completion projections.
- Manage manual and automated goal contributions via `FinancialGoalHistoryEntity`.
- Provide wallet balance calculations taking active goal reservations into account (`walletBalanceApplyGoal`).
- Goal lifecycle management (Active, Completed, Cancelled).

## Source Map
```
src/module/financial/financial-goal/
├── financial-goal.controller.ts            # REST controller extending CreateGenericController
├── financial-goal.service.ts               # Core calculation and goal lifecycle logic
├── financial-goal.module.ts                # Module definition
├── financial-goal.enum.ts                  # SAVING_MODE, STATUS, TYPE
├── financial.goal.cron.ts                  # Scheduled automatic contribution job
├── _entities/
│   └── financial-goal.entity.ts            # TypeORM entity
├── financial-goal-history/
│   └── _entities/
│       └── financial-goal-history.entity.ts # Contribution audit log
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    ├── delete.dto.ts
    └── projection.dto.ts
```

## Main Components
- **`FinancialGoalEntity`**: Defines goal name, targetAmount, currentAmount, savingMode (`MANUAL` / `AUTO`), deadline, and status (`ACTIVE`, `COMPLETED`, `CANCELLED`).
- **`FinancialGoalHistoryEntity`**: Records discrete contributions, auto-contribution logs, and skipped/completed statuses.
- **`FinancialGoalCron`**: Periodic cron (`0 0 1 * *`) for processing automated recurring contributions.
- **`FinancialGoalController`**: Base CRUD plus `:id/detail`, `:id/projection`, `wallet-balance-apply-goal`, `:id/manual-contribution`, `history/:id/complete`, `history/:id/skip`, `:id/cancel`.

## Business and Data Flows
1. User sets a financial goal with a target amount, deadline, and optional monthly auto-contribution schedule.
2. Contributions can be logged manually (`:id/manual-contribution`) or generated periodically by `FinancialGoalCron`.
3. Client can request completion estimates (`:id/projection`) given monthly saving velocity.
4. Completing or skipping pending contributions updates both `FinancialGoalEntity.currentAmount` and records a ledger transaction if applicable.

## Data Model and Relationships
- Belongs to `AccountEntity` via `accountId` (onDelete: CASCADE).
- One-to-Many `FinancialGoalHistoryEntity` (`histories`, cascade: true).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`.
- **Domain**: `AccountModule`, `FinancialWalletModule`.

## Existing Patterns and Conventions
- Uses `CreateGenericController` factory for standard pagination, updates, and deletes.
- Amounts stored as decimal and parsed using TypeORM transformers.

## Extension Guide
- To implement auto-withdrawal from a specific wallet for goal savings, link a `walletId` directly to `FinancialGoalEntity`.

## Constraints and Common Pitfalls
- `currentAmount` must not exceed `targetAmount` without explicitly transitioning the goal status to `COMPLETED`.
- Manual and automatic contributions must check whether the goal is marked `isLocked` or `CANCELLED`.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify types.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-goal/financial-goal.controller.ts`
  - `src/module/financial/financial-goal/financial-goal.service.ts`
  - `src/module/financial/financial-goal/_entities/financial-goal.entity.ts`
  - `src/module/financial/financial-goal/financial.goal.cron.ts`
- Known Gaps:
  - `FinancialGoalCron.processAutoContributions` has placeholder implementation comments awaiting automated wallet debit integration.
