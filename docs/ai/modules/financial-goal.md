# Module: Financial Goal

## Purpose
Manages user savings targets ("goals"): a target amount, an accumulated `currentAmount`, an optional deadline, and a contribution/withdrawal log. Money can optionally move in or out of a wallet — the wallet balance is adjusted directly, **no financial transaction is created** (saving is not spending; same pattern as the debt module, see ADR-009).

End-user guide (Vietnamese): `FE/docs/guides/muc-tieu-tai-chinh.md` in the frontend repo.

## Responsibilities and Boundaries
- CRUD for `FinancialGoalEntity`. Generic `paging` / `update` / `delete` routes are overridden and **owner-scoped**.
- Contributions (manual, or auto via daily cron), withdrawals, cancel with optional refund, pause / resume.
- Keep `status` consistent with money: reaching the target → `COMPLETED`; dropping below it (withdraw, raise target) → back to `ACTIVE`.
- Completion projection (incl. "required monthly amount to meet the deadline").
- Wallet balance vs goal totals summary (`wallet-balance-apply-goal`).

## Source Map
```
src/module/financial/financial-goal/
├── financial-goal.controller.ts        # Generic CRUD (paging/update/delete overridden) + custom routes
├── financial-goal.service.ts           # Business rules, money flows, runAutoContributions()
├── financial-goal.service.spec.ts      # Unit tests (in-memory manager)
├── financial-goal.cron.ts              # Daily 00:10 Asia/Ho_Chi_Minh → service.runAutoContributions()
├── financial-goal.module.ts
├── financial-goal.enum.ts              # TYPE / SAVING_MODE / STATUS
├── _entities/financial-goal.entity.ts  # Table "financial-goal"
├── financial-goal-history/
│   ├── financial-goal-history.enum.ts  # HISTORY_SOURCE / HISTORY_STATUS / HISTORY_TYPE
│   └── _entities/financial-goal-history.entity.ts   # Table "financial-goal-history"
└── dto/
    ├── create.dto.ts      # CreateFinancialGoalDto, AddManualContributionDto, WithdrawFromGoalDto, CancelGoalDto
    ├── update.dto.ts      # UpdateFinancialGoalDto (= Partial<Create> without status), CompleteAutoContributionDto
    ├── projection.dto.ts  # Request (monthlySavingRate) + Response (matches the service)
    └── get-all.dto.ts / paging.dto.ts / delete.dto.ts

src/module/financial/financial-wallet/wallet-balance.helper.ts   # applyWalletBalanceChange(), round2() — shared with debt
src/common/database/migrations/1794000006000-GoalWalletLinkAndWithdrawals.ts
```

## Data Model
**`financial-goal`**: `name`, `description?`, `type` (default `OTHER`), `targetAmount` decimal(14,2), `currentAmount` decimal(14,2) default 0, `savingMode` (`MANUAL` | `AUTO`), `status`, `deadline?` timestamptz, `imageUrl?`, `autoContributionAmount?`, `autoContributionDay?` (1–31), `isLocked` (default false), **`walletId?`** (FK wallet, `SET NULL`) = default wallet for auto contributions, `accountId` (FK account, `CASCADE`).

**`financial-goal-history`**: `goalId` (FK, `CASCADE`), `period` `"YYYY-MM"` (VN time), **`type`** (`CONTRIBUTION` | `WITHDRAWAL`, default `CONTRIBUTION`; `amount` is always positive), `plannedAmount`, `amount` (both decimal(15,2) **with** `DecimalTransformer`), `source` (`USER` | `SYSTEM`), `status` (`PENDING` | `COMPLETED` | `SKIPPED`), **`walletId?`** (FK, `SET NULL`; null = record only), `note?`, `completedAt?` (timestamp without tz).
Partial unique index `UQ_goal_history_system_period (goalId, period) WHERE source='SYSTEM' AND deletedAt IS NULL` — at most one auto contribution per goal per month.

### Status meaning
| Status | Contribute (manual / confirm pending) | Auto contribution | Withdraw | Cancel |
|---|---|---|---|---|
| `ACTIVE` | yes | yes | yes* | yes |
| `INACTIVE` (paused) | no | no | yes* | yes |
| `COMPLETED` | no (nothing left) | no | yes* → back to `ACTIVE` | no |
| `CANCELLED` | no | no | no | no |

\* blocked while `isLocked = true` ("lock withdrawals"). `isLocked` also blocks the refund on cancel. It never blocks contributions.

## API (`/financial-goal`, JWT required, all owner-scoped)
| Method | Path | Body / Query | Behaviour |
|---|---|---|---|
| GET | `/all` | — | User's goals (generic). |
| POST | `/create` | `CreateFinancialGoalDto` | Status forced `ACTIVE`, `currentAmount` 0, `isLocked` default false. AUTO requires amount + day; MANUAL clears auto fields. `walletId` must belong to the user. |
| GET | `/paging` | pagination | Only the user's goals, + `progressPercentage`. |
| POST | `/update/:id` | `UpdateFinancialGoalDto` | Only whitelisted fields (`UPDATABLE_FIELDS`); `status`/`currentAmount` ignored. Re-validates saving mode, re-syncs completion. 404 if not owner. |
| DELETE | `/delete/:id` | — | Soft delete, owner only. Does **not** refund wallets. |
| GET | `/:id/detail` | — | `{ goal (+progressPercentage, wallet), histories (newest first, with wallet) }`. |
| GET | `/:id/projection` | `monthlySavingRate?` | See Projection. |
| GET | `/wallet-balance-apply-goal` | — | Sum of non-deleted wallet balances + goal totals split ACTIVE / others. |
| POST | `/:id/manual-contribution` | `{ amount ≥ 0.01, note?, period?, walletId? }` | Goal must be `ACTIVE`; amount ≤ remaining; `walletId` → wallet −amount. |
| POST | `/:id/withdraw` | `{ amount ≥ 0.01, note?, walletId? }` | Not `CANCELLED`, not locked, amount ≤ `currentAmount`; `walletId` → wallet +amount. |
| POST | `/history/:historyId/complete` | `{ amount ≥ 0.01, note?, walletId? }` | History `PENDING`, goal `ACTIVE`, amount ≤ remaining; `walletId` → wallet −amount. |
| POST | `/history/:historyId/skip` | — | `PENDING` → `SKIPPED`, amount 0. |
| PATCH | `/:id/cancel` | `{ refundWalletId? }` | `ACTIVE`/`INACTIVE` → `CANCELLED`; pending histories → `SKIPPED`; refund = withdrawal of the whole `currentAmount` (blocked if locked). |
| PATCH | `/:id/pause` | — | `ACTIVE` → `INACTIVE`. |
| PATCH | `/:id/resume` | — | `INACTIVE` → `ACTIVE` (or `COMPLETED` if already reached). |

Errors: not-owner always **404** (goal or history). Wallet not owned → 404 `Financial wallet not found`; wallet would go negative → 400 `Insufficient wallet balance`.

## Business and Data Flows

### Money rules (`financial-goal.service.ts`)
- All money writes run in `dataSource.transaction` with `pessimistic_write` on the goal (and the history row for complete/skip); wallet rows are locked inside `applyWalletBalanceChange`.
- Contribution: `assertActive` → `assertWithinRemaining` (no silent truncation) → optional wallet debit → `currentAmount += amount` → `syncCompletion`.
- Withdrawal (`recordWithdrawal`, also used by cancel-refund): optional wallet credit → `currentAmount -= amount` → `syncCompletion` → history `WITHDRAWAL`.
- `syncCompletion`: `ACTIVE` & reached → `COMPLETED`; `COMPLETED` & not reached → `ACTIVE`; `INACTIVE`/`CANCELLED` untouched.

### Auto contribution (`runAutoContributions(today = todayVN())`)
Triggered daily by `FinancialGoalCron` at 00:10 Asia/Ho_Chi_Minh. For each `ACTIVE` + `AUTO` goal:
1. Due day = `min(autoContributionDay, daysInMonth)` (e.g. 31 → 30 in November). Run only when `today ≥ due day` (so missed days are caught up within the month) and the due date is not before the goal's creation date.
2. Skip if a `SYSTEM` history already exists for `(goalId, period)` (also enforced by the unique index).
3. `planned = min(autoContributionAmount, remaining)`; skip when 0.
4. Goal has `walletId` and the wallet has ≥ planned → debit wallet, history `COMPLETED` (note "Góp tự động").
   Otherwise → history `PENDING` with `amount 0`, `plannedAmount`, `walletId = goal.walletId` (note explains why). The user confirms (choosing amount/wallet) or skips it.
5. Each goal runs in its own transaction; failures are counted and logged, not rethrown. Returns `{ completed, pending, skipped, failed }`.

### Projection (`GET /:id/projection`)
```
remaining = max(target - current, 0)
monthly   = monthlySavingRate > 0 ? monthlySavingRate : (AUTO ? autoContributionAmount : 0)
estimatedMonthsToTarget = remaining == 0 ? 0 : (monthly > 0 ? ceil(remaining / monthly) : null)
estimatedCompletionDate = today(VN) + estimatedMonthsToTarget months (YYYY-MM-DD) | null
monthsUntilDeadline     = deadline ? (past ? 0 : max(1, ceil(days / 30.44))) : null
requiredMonthlyAmount   = deadline ? (monthsUntilDeadline == 0 ? remaining : remaining / monthsUntilDeadline) : null
onTrack                 = deadline ? (remaining == 0 || monthly >= requiredMonthlyAmount) : null
```
The FE (`goal.utils.ts → estimateMonths`) uses the same rule for cards (AUTO only).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`, `@Pagination`/`@ApiPagination`, `CurrentUser`, `@nestjs/schedule`, `DecimalTransformer`.
- **Wallet**: `applyWalletBalanceChange` from `financial-wallet/wallet-balance.helper.ts` (shared with `FinancialDebtService`); `FinancialWalletEntity` repository for ownership checks.
- **Consumers**: `FinancialDashboardService.goalsSummary` — `ACTIVE` goals only, nearest deadline first (nulls last), then newest, max 4.

## Existing Patterns and Conventions
- Owner scoping via `{ id, accountId: userId }` lookups; generic routes overridden in the controller with the **same method names** (`getPaging`, `update`, `delete`) so they replace the base routes.
- The global `ValidationPipe` has no `whitelist`, so `updateForUser` copies only `UPDATABLE_FIELDS` — add a field there when making it editable.
- User-visible history notes are Vietnamese (as in the debt module).

## Extension Guide
- **Notifications for pending contributions**: hook into `runAutoContributions` results (or query `PENDING` histories) from `financial-notification`.
- **New editable field**: add to the entity + DTO, then to `UPDATABLE_FIELDS`.
- **Other auto schedules (weekly)**: `period` is monthly and the unique index is per `(goalId, period)`; a weekly schedule needs a different period key.

## Constraints and Common Pitfalls
- Deleting a goal never refunds wallets — clients should offer "cancel with refund" first (the FE delete confirmation says so).
- `wallet-balance-apply-goal` sums wallet balances that **already exclude** money moved into goals with a wallet; `totalActiveGoalAmount` also includes money recorded without a wallet ("record only"). Don't subtract one from the other blindly.
- Cron `createdAt` comparison converts `createdAt` to a VN date; goals created on the due day itself are eligible that same day.
- `completedAt` is `timestamp without time zone`.

## Tests and Verification
- `npx jest src/module/financial/financial-goal` — 17 tests (contribution limits, wallet debit/credit, lock, cancel refund, update whitelist, owner 404, cron due-day/catch-up/idempotency/last-month planning).
- `pnpm run build` (passes).
- Migration `1794000006000` applied to `defaultdb` and production (2026-11-07).

## Documentation Status
- Status: Verified
- Last Verified: 2026-11-07
- Source Paths:
  - `src/module/financial/financial-goal/**`
  - `src/module/financial/financial-wallet/wallet-balance.helper.ts`
  - `src/common/database/migrations/1794000006000-GoalWalletLinkAndWithdrawals.ts`
- Known Gaps:
  - No notification is sent when an auto contribution becomes `PENDING`.
