# Session History

This file tracks completed development tasks, major architectural milestones, and documentation updates across sessions.

---

## 2026-11-02: Step (a) transactionDate migration

- **Task Summary**: Added a date-only transaction field and switched financial period calculations from creation time to transaction date.
- **Relevant Files**:
  - `src/common/database/migrations/1794000000000-AddTransactionDate.ts`
  - `src/common/database/migrations/1794000001000-CorrectTransactionDateTimezone.ts`
  - `src/module/financial/financial-transaction/`
  - `src/module/financial/financial-category/financial-category.service.ts`
  - `src/module/financial/financial-dashboard/financial-dashboard.service.ts`
  - `src/module/financial/financial-report/financial-report.service.ts`
  - `src/module/financial/financial-notification/financial-notification.service.ts`
- **Verification Results**:
  - Production migration and corrective backfill completed successfully.
  - Full Jest suite: 1 suite, 38 tests passed.
  - Backend build passed.
  - Full lint still reports unrelated existing errors.

---

## 2026-11-02: Step (b) monthly budgets

- **Task Summary**: Added per-category monthly budget persistence, historical backfill, rollover copy logic, and budget upsert API.
- **Relevant Files**:
  - `src/module/financial/financial-category/_entities/financial-category-budget.entity.ts`
  - `src/module/financial/financial-category/financial-category-budget.service.ts`
  - `src/common/database/migrations/1794000002000-CreateCategoryBudgets.ts`
  - `src/module/financial/financial-category/financial-category.controller.ts`
- **Verification Results**:
  - Migration completed successfully; 34 unique rows created and null values preserved.
  - Full Jest suite: 2 suites, 40 tests passed.
  - Backend build passed; scoped ESLint passed.

---

## 2026-11-02: Step (c) and (d) income plans and budget calculations

- **Task Summary**: Added independent monthly income plans and query-time budget metrics for category trees and income allocation summaries.
- **Relevant Files**:
  - `src/module/financial/financial-income-plan/`
  - `src/module/financial/financial-category/budget-calculator.ts`
  - `src/module/financial/financial-category/financial-category.service.ts`
- **Verification Results**:
  - Income plan and calculator tests passed (5 tests).
  - Backend build passed.
  - No frontend files were modified.

---

## 2026-11-02: Legacy category budget backfill repair

- **Task Summary**: Backfilled active category budget rows and repaired existing null budget rows from non-null legacy `monthlyBudget` values.
- **Relevant Files**:
  - `src/common/database/migrations/1794000004000-BackfillLegacyCategoryBudgets.ts`
  - `src/common/database/migrations/1794000005000-RepairLegacyCategoryBudgetAmounts.ts`
- **Verification Results**:
  - Migrations applied successfully to PostgreSQL.
  - Non-null legacy limits are now present in `financial-category-budget`.
  - Categories whose legacy value was already NULL remain unlimited by design.

---

## 2026-10-16: Established Shared AI Context and Codebase Documentation System

- **Task Summary**: Analyzed the monolithic NestJS backend, documented core architecture, established multi-agent workflows, and generated granular module documentation for all 17 feature subsystems.
- **Relevant Files**:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `SESSION_LOG.md`
  - `docs/ai/PROJECT_CONTEXT.md`
  - `docs/ai/ARCHITECTURE.md`
  - `docs/ai/DECISIONS.md`
  - `docs/ai/core/CORE_OVERVIEW.md`
  - `docs/ai/modules/INDEX.md`
  - `docs/ai/modules/*.md` (17 module docs)
- **Decisions Made**:
  - Formalized ADR-001 through ADR-008 in `DECISIONS.md`.
  - Defined the Core Source Protection Policy in `AGENTS.md` (requiring reuse of `BaseCrudService`, `CreateGenericController`, `BaseEntity`, and established patterns before introducing new abstractions).
  - Selected a structured documentation directory format (`docs/ai/` with `core/` and `modules/`).
- **Verification Results**:
  - Inspected active source files for all entities, services, controllers, DTOs, and cron tasks.
  - Verified no application source code was modified, deleted, or altered.
- **Outstanding Follow-up Work**:
  - Future tasks should keep module docs updated when adding new entity relations or endpoints.

---

## 2026-10-29: Production Database Schema Synchronization & Data Migration

- **Task Summary**: Synchronized production PostgreSQL database schema with TypeORM entities and migrated user preference data safely without data loss.
- **Relevant Files**:
  - `src/common/database/migrations/1787717000000-SyncProductionSchemaAndMigrateData.ts`
  - `src/module/account/_entities/account.entity.ts`
  - `src/module/profile/_entities/profile.entity.ts`
  - `src/module/feedback/_entities/feedback.entity.ts`
- **Actions Taken**:
  - Created enums: `account_type_enum`, `profile_darkmode_enum`, `profile_theme_enum`, `profile_language_enum`, `feedback_feature_enum`, `feedback_type_enum`, `feedback_status_enum`.
  - Renamed `account_entity` -> `account`, aligned primary & unique constraints, added `type` column.
  - Renamed `profile_entity` -> `profile`, aligned primary/unique/foreign key constraints, added `darkMode`, `theme`, `language` columns.
  - Migrated user preferences (`themeMode` -> `darkMode`, `theme` -> `theme`, `language` -> `language`) from `financial-setting` to `profile`.
  - Created `feedback` and `feedback-files` tables with full relational constraints and indexes.
  - Executed migration via `npm run migration:run` and verified 0 schema drift.
- **Verification Results**:
  - `npm run migration:run` completed successfully (exit code 0).
  - Schema builder log confirmed 0 structural differences.
  - Verified user data integrity on `account` and `profile`.
  - `npm run build` passed with zero errors.

---

## 2026-11-07: Financial goal overhaul

- Owner-scoped goal `paging` / `update` / `delete` (were open to any user); update copies only whitelisted fields, status changes via cancel / pause / resume.
- Wallet link: optional `walletId` on manual contribution, pending confirmation, withdrawal (new) and cancel refund; goal `walletId` = default auto-contribution wallet. Shared `financial-wallet/wallet-balance.helper.ts` (debt now uses it too). ADR-009.
- Daily auto-contribution cron (00:10 VN): debits default wallet when enough, else creates PENDING; idempotent per (goalId, period) with a partial unique index.
- Contributions can no longer exceed the remaining amount; `isLocked` blocks withdraw/refund; INACTIVE = paused; projection DTO fixed + deadline metrics; dashboard goals = ACTIVE only.
- Migration `1794000006000-GoalWalletLinkAndWithdrawals` **run on defaultdb only**; production pending.
- Verification: goal spec 17/17, full Jest 62/62, `tsc --noEmit` clean, scoped ESLint clean. `pnpm run build` fails only on 6 pre-existing missing-module errors (see below).
- **Blocker (pre-existing, not from this task)**: `node_modules` was reinstalled with pnpm on 2026-11-06 14:42 (`pnpm-lock.yaml` modified, uncommitted). `socket.io`, `dotenv`, `@opentelemetry/*`, `express`… are not declared in `package.json`, so they are no longer resolvable; `nest start --watch` cannot boot. Needs a decision: declare the deps or use a hoisted node-linker.

---

## 2026-11-07: Goal follow-up — dependencies and production migration

- Declared missing runtime deps (`express`, `socket.io`, `dotenv`, `@opentelemetry/core`, `@opentelemetry/sdk-trace-base`) at the versions already locked; `pnpm run build` now passes and the app boots.
- Ran `1794000006000-GoalWalletLinkAndWithdrawals` on production; verified columns `financial-goal.walletId`, `financial-goal-history.walletId`/`type` and index `UQ_goal_history_system_period`.

---

## 2026-11-09: Debt — gộp nhiều lần vay của một người vào một khoản

- Model: one debt per person + direction. New `POST /financial-debt/:id/increase` (vay / cho vay thêm; reopens PAID_OFF), `POST /financial-debt/merge` (same direction, ACTIVE only; sources → status `MERGED`, `mergedIntoId`, outstanding 0; history `MERGED_OUT` / `MERGED_IN`; no wallet change), `POST /financial-debt/person-payment` (FIFO by `startDate`, `id`; one wallet change for the total, one PAYMENT history per debt).
- Person matching: `normalizePersonName` (trim, collapse spaces, lower case) in `financial-debt.allocation.ts`; merge does not require identical names (lets users merge typo variants).
- Migration `1794000007000-DebtMergeAndIncrease` (enum values + `mergedIntoId`) **not run yet** — run `pnpm run migration:run` on each DB before deploying.
- Follow-up: payments may exceed the outstanding amount (single and person payment). Debt goes to 0 / PAID_OFF, wallet moves the full amount, the excess is a separate `INTEREST` history row (person payment: excess on the newest debt). Migration `1794000008000-DebtHistoryInterest`. Both migrations applied to local `defaultdb` (production not yet). Allocation spec 7/7.
- Verification: allocation spec 4/4, `pnpm run build` and `tsc --noEmit` pass, scoped ESLint clean. Endpoints not exercised against a live DB.
