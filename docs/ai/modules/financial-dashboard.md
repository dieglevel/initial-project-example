# Module: Financial Dashboard

## Purpose
Consolidated financial dashboard aggregator. Serves high-level summaries for mobile and web home screens, incorporating current balances, cash flow timelines, category spending breakdowns, goal progress, and debt obligations tailored to the user's billing cycle start date.

## Responsibilities and Boundaries
- Serve a single high-performance summary endpoint (`GET /financial-dashboard/summary`) for client home screens.
- Calculate user financial cycle periods using per-user `cycleStartDate` from `FinancialSettingEntity`.
- Aggregate total balance across all user wallets (or a single filtered wallet).
- Compute current cycle income, expense, and net savings.
- Generate cash flow timeline points for sparklines/charts.
- Aggregate top spending categories and progress toward active goals and debts.

## Source Map
```
src/module/financial/financial-dashboard/
├── financial-dashboard.controller.ts     # REST controller with /summary endpoint
├── financial-dashboard.service.ts        # Comprehensive aggregation service
├── financial-dashboard.module.ts         # Module definition
└── dto/
    └── financial-dashboard.dto.ts        # Request filter & composite dashboard response
```

## Main Components
- **`FinancialDashboardService`**: Injects repositories across transactions, items, wallets, goals, debts, and settings to build a unified response payload.
- **`FinancialDashboardController`**: Exposes `GET /financial-dashboard/summary`.

## Business and Data Flows
1. User requests dashboard summary specifying timeframe (`WEEKLY`, `MONTHLY`, `YEARLY`, `ALL_TIME`) and optional `walletId`.
2. Service reads user preferences from `FinancialSettingEntity` to determine the cycle start day (e.g., salary day on the 5th of the month).
3. Executes parallel or sequential queries to gather wallet balances, date-bounded transactions, goal completions, and outstanding debt amounts.
4. Maps and returns the consolidated `FinancialDashboard_Response`.

## Data Model and Relationships
- Composite read model; does not own dedicated database entities.
- Aggregates data across:
  - `FinancialTransactionEntity` & `FinancialTransactionItemEntity`
  - `FinancialWalletEntity`
  - `FinancialGoalEntity`
  - `FinancialDebtEntity`
  - `FinancialSettingEntity`

## Dependencies and Integrations
- **Third-Party**: `dayjs` for flexible cycle date math.
- **Domain**: All major financial submodules.

## Existing Patterns and Conventions
- Uses `cycleStartDate` from settings to compute custom billing cycle boundaries rather than strictly defaulting to calendar month starts.
- Returns comprehensive single-shot payload to reduce mobile client round-trips.

## Extension Guide
- To add investment performance or net worth delta metrics, add calculation blocks in `FinancialDashboardService.getDashboardSummary()`.

## Constraints and Common Pitfalls
- Aggregation touches multiple tables; queries must be indexed on `(accountId, createdAt)` to avoid slow performance on large transaction ledgers.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify DTO and type safety.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-dashboard/financial-dashboard.controller.ts`
  - `src/module/financial/financial-dashboard/financial-dashboard.service.ts`
- Known Gaps: None.
