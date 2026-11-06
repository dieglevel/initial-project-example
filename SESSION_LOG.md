# Current Session

## 2026-11-07: Financial goal overhaul

- Owner-scoped goal `paging` / `update` / `delete` (were open to any user); update copies only whitelisted fields, status changes via cancel / pause / resume.
- Wallet link: optional `walletId` on manual contribution, pending confirmation, withdrawal (new) and cancel refund; goal `walletId` = default auto-contribution wallet. Shared `financial-wallet/wallet-balance.helper.ts` (debt now uses it too). ADR-009.
- Daily auto-contribution cron (00:10 VN): debits default wallet when enough, else creates PENDING; idempotent per (goalId, period) with a partial unique index.
- Contributions can no longer exceed the remaining amount; `isLocked` blocks withdraw/refund; INACTIVE = paused; projection DTO fixed + deadline metrics; dashboard goals = ACTIVE only.
- Migration `1794000006000-GoalWalletLinkAndWithdrawals` applied to `defaultdb` and **production** (prod had 0 goals; pre-checked for duplicate SYSTEM rows).
- Dependency fix: `node_modules` had been reinstalled with pnpm (2026-11-06 14:42), which hid packages the code imports but `package.json` did not declare. Declared them at the versions already in the lock: `express@^5.2.1`, `socket.io@^4.8.3`, `dotenv@^16.6.1`, `@opentelemetry/core@^2.12.0`, `@opentelemetry/sdk-trace-base@^2.12.0`. pnpm reports ignored build scripts (bcrypt, @swc/core…) — bcrypt v6 ships prebuilds and was verified to hash.
- Verification: goal spec 17/17, full Jest 62/62, `pnpm run build` passes, app boots (`dist/src/main.js` on a temp port) with all 15 goal routes mapped once; unauthenticated call → 401.

## 2026-11-02: Step (a) transactionDate migration

- Added date-only `transactionDate` to financial transactions and migrated category, dashboard, report, notification, and transaction filters/grouping away from `createdAt`.
- Legacy `createdAt` is `timestamp without time zone` containing UTC values, so the production backfill uses UTC -> Asia/Ho_Chi_Minh conversion; a corrective migration repaired the first applied backfill.
- Verification: production sample matched stored dates after correction; migration and index verified; full Jest 38/38 passed; backend build passed; full lint retains unrelated pre-existing errors.

## 2026-11-02: Step (b) monthly budgets

- Added `financial-category-budget` with nullable amount and unique `(categoryId, month)`.
- Backfilled each category from its first transaction month through the current month; current/next month rollover is idempotent with `ON CONFLICT DO NOTHING`.
- Verification: production migration created 34 unique rows; 23 nullable amounts preserved; full Jest 40/40 passed; backend build and scoped ESLint passed.

## 2026-11-02: Step (c) and (d) income plans and budget calculations

- Added independent `income_plans` GET/PUT API and pure budget/income allocation calculators.
- Category list responses now include uncapped percent, status, remaining, child allocation, and over-allocation fields; budget summary exposes expected income allocation.
- Verification: income plan and calculator tests pass; backend build passes. UI remains unchanged.

## 2026-11-02: Legacy category budget backfill repair

- Added idempotent migrations to create missing budget rows for active categories and copy non-null legacy `monthlyBudget` values into existing null budget rows.
- Production verification: legacy limits for `Trọ`, `Ăn uống`, `Di chuyển`, `Shopping / Mua sắm`, and `Sức khỏe & Y tế` are present in the new budget table.
- `Điện`, `Nước`, `Phòng`, and `Đồ uống` remain unlimited because their legacy `monthlyBudget` values are already NULL in the database.

## Status
Completed

## Objective
Synchronize the production PostgreSQL database schema with TypeORM entity definitions and safely migrate user settings data without data loss.

## Work Completed
1. Inspected production database structure against TypeORM schema builder diff.
2. Identified major discrepancies:
   - `account_entity` in DB vs `account` entity in TypeORM (plus added `type: AccountType` enum column).
   - `profile_entity` in DB vs `profile` entity in TypeORM (plus added `darkMode`, `theme`, and `language` enum columns).
   - Missing `feedback` and `feedback-files` tables and their associated enums.
   - All foreign keys from child tables pointing to `account_entity`.
3. Created TypeORM migration `1787717000000-SyncProductionSchemaAndMigrateData.ts`:
   - Created all required enum types (`account_type_enum`, `profile_darkmode_enum`, `profile_theme_enum`, `profile_language_enum`, `feedback_*_enum`).
   - Renamed `account_entity` -> `account` and updated primary/unique constraints.
   - Renamed `profile_entity` -> `profile` and updated primary/unique/foreign key constraints.
   - Preserved all child FK relationships.
   - Migrated user preferences (`themeMode` -> `darkMode`, `theme` -> `theme`, `language` -> `language`) from `financial-setting` into `profile`.
   - Created `feedback` and `feedback-files` tables with full relational constraints and indexes.
4. Executed `npm run migration:run` successfully against production database.
5. Verified that 0 schema differences remain (except standard cosmetic interval default comparison for `idempotency_record`). Verified sample data integrity in `account` and `profile`.
6. Verified application build cleanly compiles via `npm run build`.

## Files Created or Updated
- `src/common/database/migrations/1787717000000-SyncProductionSchemaAndMigrateData.ts`
- `SESSION_LOG.md`
- `SESSION_HISTORY.md`

## Verification Results
- Ran `npm run migration:run` (Exit code 0).
- Ran schema difference inspection (0 remaining structural differences, all tables and data verified).
- Ran `npm run build` (Exit code 0).

## Unresolved Issues
- None. Database schema is now 100% matched with TypeORM entities, and user settings data has been migrated cleanly.

## Next Steps
- Verify frontend interaction with user profile and feedback submission.
