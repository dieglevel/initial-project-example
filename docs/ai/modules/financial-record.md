# Module: Financial Record

## Purpose
Automated bank notification ingestion service. Receives push notification payloads emitted by mobile notification listeners (e.g. Android bank SMS/app notification forwarders), parses financial transactions using pluggable bank adapters, and automatically records transactions into user wallets.

## Responsibilities and Boundaries
- Expose unauthenticated/public webhook endpoints secured via wallet API keys (`x-api-key` header or URL path param).
- Deduplicate bank notifications via `idNotification` index.
- Pluggable bank parsing pipeline (`IBankAdapter`, `BankAdapterService`) extracting amounts, transaction types, balances, and descriptions.
- Automatically construct and link `FinancialTransactionEntity` records to the matching `FinancialWalletEntity`.

## Source Map
```
src/module/financial/financial-record/
├── financial-record.controller.ts        # Webhook endpoints (@Public, apiKey validated)
├── financial-record.service.ts           # Ingestion pipeline & adapter dispatcher
├── financial-record.module.ts            # Module definition
├── android.config.md                     # Android client setup guide
├── _entities/
│   └── financial-record.entity.ts        # Ingested notification log
├── adapters/
│   ├── bank-adapter.interface.ts         # IBankAdapter contract
│   ├── bank-adapter.service.ts           # Registry matching appPackage
│   ├── generic-bank.adapter.ts           # Fallback regex parser
│   └── implement/                        # Bank-specific parsers (Vietcombank, MBBank, Techcombank, etc.)
└── dto/
    └── record.dto.ts
```

## Main Components
- **`FinancialRecordEntity`**: Stores incoming raw JSON notification payload, status, parsedAmount, `idNotification` dedupe key, `walletId`, and `transactionId`.
- **`BankAdapterService`**: Resolves the appropriate bank adapter based on `appPackage` identifier or notification text patterns.
- **`FinancialRecordController`**: Exposes `@Public()` endpoints:
  - `POST /financial-record/record` (expects `x-api-key` header)
  - `POST /financial-record/record/:apiKey` (path-based key)
  - `GET /financial-record` (audit list)

## Business and Data Flows
1. Android phone with a notification listener service intercepts a bank push notification (e.g., from MBBank, Techcombank, Vietcombank).
2. The phone forwards the notification JSON to `POST /financial-record/record` with the wallet's `apiKey` (`wapi_*`).
3. The controller locates the associated wallet using `apiKey`.
4. Ingestion checks `idNotification` to ensure the notification has not been processed already.
5. `BankAdapterService` selects the matching adapter to extract amount and description.
6. A new transaction is created in `FinancialTransactionModule`, adjusting the wallet balance automatically.

## Data Model and Relationships
- Belongs to `FinancialWalletEntity` via `walletId`.
- Creates and links to `FinancialTransactionEntity` via `transactionId`.

## Dependencies and Integrations
- **Core**: `BaseEntity`, `@Public()` decorator.
- **Domain**: `FinancialWalletModule`, `FinancialTransactionModule`.

## Existing Patterns and Conventions
- Uses wallet-specific API keys (`wapi_<hex>`) instead of user JWTs, allowing background mobile forwarders to push without login sessions.
- Bank adapters implement `IBankAdapter` with `canHandle(payload)` and `parse(payload)` methods.

## Extension Guide
- To add support for a new banking institution: create `<bank-name>.adapter.ts` in `adapters/implement/` implementing `IBankAdapter`, and register it in `BankAdapterService`.

## Constraints and Common Pitfalls
- Deduplication is critical: `idNotification` column has a unique partial index `WHERE "idNotification" IS NOT NULL`.
- API keys must be kept confidential; if compromised, generate a new key using `POST /financial-wallet/:id/api-key`.

## Tests and Verification
- Use `POST /financial-record/test-record` for dry-run validation of bank parsing logic without persisting records.
- Run `pnpm run build` to verify adapter typing.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-record/financial-record.controller.ts`
  - `src/module/financial/financial-record/financial-record.service.ts`
  - `src/module/financial/financial-record/adapters/bank-adapter.service.ts`
  - `src/module/financial/financial-record/_entities/financial-record.entity.ts`
- Known Gaps: None.
