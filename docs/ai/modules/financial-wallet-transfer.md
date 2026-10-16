# Module: Financial Wallet Transfer

## Purpose
Tracks and records inter-wallet transfer history, fee charges, and balances moved between user wallets.

## Responsibilities and Boundaries
- Audit log of completed wallet-to-wallet fund transfers.
- Tracks source wallet (`fromWallet`), destination wallet (`toWallet`), transfer `amount`, and `transferFee`.
- Queries historical wallet transfer activity.
- Note: The actual transfer execution endpoint is hosted on `FinancialWalletController` (`POST /financial-wallet/transfer`), which delegates to this entity for historical persistence.

## Source Map
```
src/module/financial/financial-wallet-transfer/
├── financial-wallet-transfer.controller.ts    # REST controller querying transfer history
├── financial-wallet-transfer.service.ts       # Query service
├── financial-wallet-transfer.module.ts        # Module definition
├── _entities/
│   └── financial-wallet-transfer.entity.ts    # Transfer history entity
└── dto/
    └── get.dto.ts
```

## Main Components
- **`FinancialWalletTransferEntity`**: Entity storing `fromWallet`, `toWallet`, `amount`, and `transferFee`.
- **`FinancialWalletTransferService`**: Provides historical transfer query operations.
- **`FinancialWalletTransferController`**: Exposes `GET /financial-wallet-transfer?date=...`.

## Business and Data Flows
1. User requests transfer between wallets in `financial-wallet`.
2. Wallet balance is deducted from source and added to destination (minus fee).
3. A `FinancialWalletTransferEntity` record is inserted with the transfer details.
4. Clients query `GET /financial-wallet-transfer` to render transfer audit records.

## Data Model and Relationships
- Many-to-One with `FinancialWalletEntity` (`fromWallet`).
- Many-to-One with `FinancialWalletEntity` (`toWallet`).

## Dependencies and Integrations
- **Core**: `BaseEntity`.
- **Domain**: `FinancialWalletModule`.

## Existing Patterns and Conventions
- Response formatted using `FinancialWalletTransfer_Get_Response`.
- Global JWT protection via `@ApiBearerAuth("access-token")`.

## Extension Guide
- To add recurring inter-wallet transfers, link this entity to `FinancialRecurringEntity`.

## Constraints and Common Pitfalls
- Transfer operations must ensure `fromWallet` and `toWallet` belong to the same authenticated user.

## Tests and Verification
- Run `pnpm run build` to verify type checks and imports.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-wallet-transfer/financial-wallet-transfer.controller.ts`
  - `src/module/financial/financial-wallet-transfer/financial-wallet-transfer.service.ts`
  - `src/module/financial/financial-wallet-transfer/_entities/financial-wallet-transfer.entity.ts`
- Known Gaps: None.
