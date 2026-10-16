# Module: Financial Report

## Purpose
Provides financial analytics and reporting aggregates including cash flow analysis, categorized spending breakdowns, net worth calculations, and budget performance metrics over customizable time periods.

## Responsibilities and Boundaries
- Compute aggregated financial reports for authenticated users.
- Calculate Cash Flow trends (`getCashFlow`) by daily, weekly, or monthly buckets.
- Compute Spending Analysis (`getSpendingAnalysis`) grouped by category with percentages.
- Calculate Net Worth (`getNetWorth`) summing assets (cash, bank, investments) and subtracting liabilities (credit card debt, loans).
- Evaluate Budget Performance (`getBudgetPerformance`) comparing actual expenses against monthly category budgets.
- Does not define persistent entities of its own; reads data from transactions, wallets, and categories.

## Source Map
```
src/module/financial/financial-report/
├── financial-report.controller.ts        # REST controller for report queries
├── financial-report.service.ts           # Aggregation algorithms and date-range resolvers
├── financial-report.module.ts            # Module definition
└── dto/
    ├── query.dto.ts                      # Period filters (DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM)
    ├── cash-flow.dto.ts                  # Income vs Expense time series
    ├── spending-analysis.dto.ts          # Category breakdown with percentage shares
    ├── net-worth.dto.ts                  # Asset vs Liability breakdown
    └── budget-performance.dto.ts         # Budget vs Actual spending per category
```

## Main Components
- **`FinancialReportService`**: Contains analytical queries using TypeORM repositories (`FinancialTransactionEntity`, `FinancialWalletEntity`, `FinancialCategoryEntity`) and date bucketing via `dayjs`.
- **`FinancialReportController`**: Exposes `/cash-flow`, `/spending-analysis`, `/net-worth`, and `/budget-performance`.

## Business and Data Flows
1. Client requests report with query params (`period`, `startDate`, `endDate`, optional `walletId`).
2. Service resolves date ranges using `resolveRange()`.
3. In-memory or database aggregations compute sums, filtering out failed transactions and internal wallet transfers.
4. Returns typed summary responses with series data and metric totals.

## Data Model and Relationships
- Pure query engine with no dedicated database table.
- Reads from `FinancialTransactionEntity`, `FinancialWalletEntity`, and `FinancialCategoryEntity`.

## Dependencies and Integrations
- **Third-Party**: `dayjs` for timezone and date bucket manipulations.
- **Domain**: `FinancialTransactionModule`, `FinancialWalletModule`, `FinancialCategoryModule`.

## Existing Patterns and Conventions
- Uses `Between(range.from, range.to)` for bounded SQL index scans.
- All endpoints protected by `@ApiBearerAuth("access-token")` and scoped by `@CurrentUser()`.

## Extension Guide
- To add predictive forecasting or trend line regressions, extend `FinancialReportService` with forecasting utilities based on historical moving averages.

## Constraints and Common Pitfalls
- Transfers between wallets (`FINANCIAL_TRANSACTION_TYPE.TRANSFER`) must be excluded from income/expense calculations to avoid artificial inflation.
- Soft-deleted entities are excluded by default in TypeORM.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify analytical calculation types.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-report/financial-report.controller.ts`
  - `src/module/financial/financial-report/financial-report.service.ts`
- Known Gaps: None.
