# Module: Financial Transaction

## Purpose
Core ledger transaction module. Records, updates, refunds, and categorizes income and expense transactions with strict idempotency protection and automated wallet balance adjustments.

## Responsibilities and Boundaries
- Record single and split-item financial transactions.
- Maintain transactional consistency with `FinancialWalletEntity` balances.
- Support transaction refunds linked to parent transactions (`originalTransactionId`).
- Enforce mutation idempotency via client-generated `Idempotency-Key` headers.
- Manage transaction receipts and split category allocations via `FinancialTransactionItemEntity`.

## Source Map
```
src/module/financial/financial-transaction/
├── financial-transaction.controller.ts       # Controller with Idempotency enforcement
├── financial-transaction.service.ts          # Core ledger logic and wallet updates
├── financial-transaction.module.ts           # Module definition
├── financial-transaction.enum.ts             # FINANCIAL_TRANSACTION_TYPE, STATUS
├── _entities/
│   ├── financial-transaction.entity.ts       # Header transaction record
│   └── financial-transaction-item.entity.ts  # Line item breakdown with category
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    └── delete.dto.ts
```

## Main Components
- **`FinancialTransactionEntity`**: Main transaction record storing total amount, wallet reference, status, merchant, and optional refund relations.
- **`FinancialTransactionItemEntity`**: Sub-items representing specific category splits within a single transaction.
- **`FinancialTransactionController`**: Exposes `/get`, `/view/:id`, and overrides `/create`, `/update/:id`, `/delete/:id` with `@UseIdempotency()`.
- **`FinancialTransactionService`**: Orchestrates balance recalculation, database transactions, and refund tracking.

## Business and Data Flows
1. **Creation**: Client sends transaction data with `Idempotency-Key: <UUID>`. The service creates the header and items, and adjusts the associated wallet's balance. If the key was already processed, the cached response is returned without duplicating the charge.
2. **Refund**: A refund transaction references `originalTransactionId`, reversing the amount while preserving historical audit trails.
3. **Deletion / Soft-Delete**: Deleting a transaction reverts the wallet balance changes.

## Data Model and Relationships
- Belongs to `AccountEntity` via `accountId`.
- Belongs to `FinancialWalletEntity` via `walletId` (onDelete: CASCADE).
- One-to-Many `financialTransactionItems` (`FinancialTransactionItemEntity`).
- Self-referencing Many-to-One `originalTransaction` for refund tracking.

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`, `IdempotencyInterceptor`, `DecimalTransformer`.
- **Domain**: `FinancialWalletModule`, `FinancialCategoryModule`, `AccountModule`.

## Existing Patterns and Conventions
- Uses `DecimalTransformer` for PostgreSQL numeric decimal columns.
- Mutation endpoints (`createOverride`, `updateOverride`, `deleteOverride`) are explicitly wrapped in `@UseIdempotency()`.
- Controller extends `CreateGenericController` but overrides core mutation routes to enforce domain rules and balance updates.

## Extension Guide
- When introducing auto-tagging or OCR receipts: link uploaded file URL from `StaticFileModule` to `receiptImageUrl` and parse merchant/amount in a background worker before saving.

## Constraints and Common Pitfalls
- **Balance Invariants**: Never mutate transaction amounts without corresponding updates to wallet balance within the same database transaction.
- **Idempotency**: Clients must send unique UUID v4 keys per user intent. Ensure tests mock or supply valid `Idempotency-Key` headers.

## Tests and Verification
- Unit test suite: `financial-transaction.service.spec.ts`.
- Run tests: `pnpm run test`.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-transaction/financial-transaction.controller.ts`
  - `src/module/financial/financial-transaction/financial-transaction.service.ts`
  - `src/module/financial/financial-transaction/_entities/financial-transaction.entity.ts`
  - `src/module/financial/financial-transaction/_entities/financial-transaction-item.entity.ts`
- Known Gaps: None.
