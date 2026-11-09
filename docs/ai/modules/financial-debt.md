# Module: Financial Debt

## Purpose
Manages loans and debts (both money owed to others and money lent to others), providing full lifecycle management: payments, debt forgiveness/settlements, interest/amount corrections, and history logs.

## Responsibilities and Boundaries
- Track debts owed (`BORROWED`) and receivables (`LENT`) via `FINANCIAL_DEBT_DIRECTION_ENUM`.
- Maintain `originalAmount` and `outstandingAmount`.
- Handle debt payments (`POST /:id/payment`), integrating with wallet balances.
- Support debt balance adjustments, settlements, cancellations, and amount corrections.
- Maintain immutable history logs via `FinancialDebtHistoryEntity`.

## Source Map
```
src/module/financial/financial-debt/
├── financial-debt.controller.ts          # Controller extending CreateGenericController
├── financial-debt.service.ts             # Debt lifecycle and wallet integration
├── financial-debt.module.ts              # Module definition
├── financial-debt.enum.ts                # DIRECTION, STATUS, TYPE
├── financial-debt-history.enum.ts        # CREATED, PAYMENT, ADJUSTMENT, SETTLED, CANCELLED, CORRECTED, INCREASED, MERGED_IN, MERGED_OUT, INTEREST
├── financial-debt.allocation.ts          # normalizePersonName + allocateFifo (pure, spec'd)
├── _entities/
│   ├── financial-debt.entity.ts          # Main debt record
│   └── financial-debt-history.entity.ts  # Historical audit log
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    ├── delete.dto.ts
    ├── action.dto.ts
    └── get-history.dto.ts
```

## Main Components
- **`FinancialDebtEntity`**: Stores debtor/creditor name (`namePerson`), direction, amounts, start and due dates, and status (`ACTIVE`, `PAID`, `CANCELLED`).
- **`FinancialDebtHistoryEntity`**: Audit trail of every action (payment, adjustment, settlement).
- **`FinancialDebtService`**: Manages debt operations, recalculating `outstandingAmount` and updating wallet balances on payment.
- **`FinancialDebtController`**: Base generic controller plus `/my-debts`, `/merge`, `/person-payment`, `/:id/payment`, `/:id/increase`, `/:id/adjust`, `/:id/settle`, `/:id/cancel`, `/:id/correct`, `/:id/histories`.

## Business and Data Flows
1. User records a debt: specifies debtor name, amount, direction (`BORROW` or `LEND`), and optional due date.
2. User makes a partial or full payment via `POST /:id/payment`:
   - Service deducts payment amount from wallet (if paying borrowed debt) or deposits into wallet (if receiving lent repayment).
   - Reduces `outstandingAmount`.
   - Records an entry in `FinancialDebtHistoryEntity`.
   - If `outstandingAmount` reaches 0, sets status to `PAID`.
3. If negotiated, user can settle or forgive the balance via `POST /:id/settle`.
4. One debt per person + direction ("gộp"):
   - `POST /:id/increase` — borrow / lend more into an existing ACTIVE or PAID_OFF debt (reopened as ACTIVE); adds to `originalAmount` and `outstandingAmount`, optional wallet change (same direction as create), history `INCREASED`.
   - `POST /merge` `{ targetId, sourceIds }` — ACTIVE debts with the same direction only (names may differ). Target gets the sum of original/outstanding, earliest `startDate` and `dueDate`; each source becomes `MERGED` with `mergedIntoId`, outstanding 0, history `MERGED_OUT` (target gets `MERGED_IN`). No wallet change.
   - `POST /person-payment` `{ namePerson, direction, amount, walletId? }` — pays all ACTIVE debts of that person (normalized name) and direction, oldest `startDate` first (FIFO). One wallet change for the total, one PAYMENT history per debt.

## Data Model and Relationships
- Belongs to `AccountEntity` via `accountId` (onDelete: CASCADE).
- Composite index on `[accountId, status]`.
- One-to-Many `histories` (`FinancialDebtHistoryEntity`).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`, `DecimalTransformer`.
- **Domain**: `FinancialWalletModule`, `AccountModule`.

## Existing Patterns and Conventions
- Uses `DecimalTransformer` on `originalAmount` and `outstandingAmount`.
- Actions mutate state and simultaneously record history snapshots for full auditability.

## Extension Guide
- To support compound interest or automated late fee penalties, add interest rate fields and a scheduled cron evaluation job.

## Constraints and Common Pitfalls
- Payments may exceed `outstandingAmount`: the debt goes to 0 (PAID_OFF), the wallet moves the full amount, and the excess is recorded as an `INTEREST` history row (person payment: on the newest debt). Migration `1794000008000-DebtHistoryInterest`.
- `MERGED` debts keep their original amount but zero outstanding — exclude them from totals (dashboard only counts ACTIVE).
- `correctAmount` compensates only the wallet of the `CREATED` history, not wallets used by later `INCREASED` entries.
- Migration `1794000007000-DebtMergeAndIncrease` adds the enum values and `mergedIntoId`.
- Payments that impact wallet balances must execute inside a database transaction. Wallet changes go through the shared `applyWalletBalanceChange` helper (`financial-wallet/wallet-balance.helper.ts`, ADR-009); no financial transaction is created.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify types.

## Documentation Status
- Status: Verified
- Last Verified: 2026-11-09
- Source Paths:
  - `src/module/financial/financial-debt/financial-debt.controller.ts`
  - `src/module/financial/financial-debt/financial-debt.service.ts`
  - `src/module/financial/financial-debt/_entities/financial-debt.entity.ts`
  - `src/module/financial/financial-debt/_entities/financial-debt-history.entity.ts`
- Known Gaps: None.
