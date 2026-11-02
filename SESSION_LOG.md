# Current Session

## 2026-11-02: Step (a) transactionDate migration

- Added date-only `transactionDate` to financial transactions and migrated category, dashboard, report, notification, and transaction filters/grouping away from `createdAt`.
- Legacy `createdAt` is `timestamp without time zone` containing UTC values, so the production backfill uses UTC -> Asia/Ho_Chi_Minh conversion; a corrective migration repaired the first applied backfill.
- Verification: production sample matched stored dates after correction; migration and index verified; full Jest 38/38 passed; backend build passed; full lint retains unrelated pre-existing errors.

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
