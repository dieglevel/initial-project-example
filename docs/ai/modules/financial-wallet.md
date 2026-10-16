# Module: Financial Wallet

## Purpose
Manages user financial accounts/wallets (cash, bank accounts, credit cards, e-wallets, investments) including balance tracking, credit limits, inter-wallet transfers, and automated external ingestion via wallet API keys.

## Responsibilities and Boundaries
- CRUD operations for user wallets and financial accounts.
- Maintain accurate balance balances and credit limits.
- Support wallet transfer logic (`transferBetweenWallets`).
- Generate and manage external `apiKey` tokens (`wapi_*`) for automated balance/record ingestion (e.g. from mobile notification listeners).
- Daily spending lock control (`isLockedForDailySpending`).

## Source Map
```
src/module/financial/financial-wallet/
├── financial-wallet.controller.ts        # REST controller extending CreateGenericController
├── financial-wallet.service.ts           # Service extending BaseCrudService
├── financial-wallet.module.ts            # Module definition
├── financial-wallet.enum.ts              # FINANCIAL_WALLET_TYPE
├── _entities/
│   └── financial-wallet.entity.ts        # TypeORM entity with BeforeInsert hook for apiKey
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    ├── delete.dto.ts
    ├── transfer.dto.ts
    └── get-with-transaction-count.dto.ts
```

## Main Components
- **`FinancialWalletEntity`**: Defines wallet attributes, balances, credit limits, and auto-generates a unique `apiKey` (`wapi_<hex>`) via `@BeforeInsert()`.
- **`FinancialWalletService`**: Implements wallet balance adjustments, inter-wallet transfers, and wallet aggregations.
- **`FinancialWalletController`**: Exposes `/with-transaction-count`, `/transfer`, and `/:id/api-key`.

## Business and Data Flows
1. **Wallet Creation**: User sets name, type (`CASH`, `BANK`, `CREDIT_CARD`, etc.), initial balance, and styling properties (color, icon). A unique `apiKey` is generated automatically.
2. **Transfer**: Client calls `POST /financial-wallet/transfer` to transfer funds between two wallets, deducting from source and adding to destination with optional transfer fees.
3. **Transaction Linking**: Each ledger transaction references a wallet, adjusting balance accordingly.

## Data Model and Relationships
- Belongs to `AccountEntity` via `accountId` foreign key.
- Has many `FinancialTransactionEntity` records.
- Source/destination in `FinancialWalletTransferEntity`.

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`.
- **Domain**: `AccountEntity`, `FinancialTransactionEntity`, `FinancialWalletTransferEntity`.

## Existing Patterns and Conventions
- Uses `CreateGenericController` for generic CRUD.
- Decimals for `balance`, `creditLimit`, and `currentDebt` utilize custom TypeORM transformers.
- API key format uses `wapi_` prefix followed by 32 hex characters.

## Extension Guide
- To support multi-currency wallets, add a `currency` field to `FinancialWalletEntity` referencing `FINANCIAL_SETTING_CURRENCY`.
- For bank sync or open banking integrations, bind the bank connection ID to the wallet record.

## Constraints and Common Pitfalls
- Transfers between wallets must execute inside a database transaction to prevent unbalanced states if one operation fails.
- Never expose raw full account numbers; only store `accountNumberMasked`.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify compilation.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-wallet/financial-wallet.controller.ts`
  - `src/module/financial/financial-wallet/financial-wallet.service.ts`
  - `src/module/financial/financial-wallet/_entities/financial-wallet.entity.ts`
  - `src/module/financial/financial-wallet/financial-wallet.enum.ts`
- Known Gaps: None.
