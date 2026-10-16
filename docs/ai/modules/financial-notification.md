# Module: Financial Notification

## Purpose
Financial smart alert and notification engine. Computes and delivers spending alerts, budget exceedance warnings, debt due date reminders, and recurring payment triggers.

## Responsibilities and Boundaries
- Store and deliver user notifications (`FinancialNotificationEntity`).
- Support severity levels (`INFO`, `WARNING`, `DANGER`) and notification types.
- Deduplicate alerts via `dedupeKey` column.
- Scheduled daily evaluation of smart alert conditions at 08:00 AM via `FinancialNotificationCron`.
- Support manual smart alert runs and unread notification retrieval.

## Source Map
```
src/module/financial/financial-notification/
├── financial-notification.controller.ts    # REST controller extending CreateGenericController
├── financial-notification.service.ts       # Alert generation & unread querying
├── financial-notification.module.ts        # Module definition
├── financial-notification.enum.ts          # NOTIFICATION_TYPE, LEVEL
├── financial-notification.cron.ts          # Daily cron schedule ("0 8 * * *")
├── _entities/
│   └── financial-notification.entity.ts    # TypeORM entity
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    ├── delete.dto.ts
    ├── mark-read.dto.ts
    └── run-smart-alerts.dto.ts
```

## Main Components
- **`FinancialNotificationEntity`**: Persists title, message, level (`INFO`, `WARNING`, `DANGER`), read status, JSON metadata, and `dedupeKey`.
- **`FinancialNotificationCron`**: Daily job running at 08:00 (`0 8 * * *`) executing `runSmartAlertsForAllAccounts()`.
- **`FinancialNotificationService`**: Checks financial health indicators (budget limits, upcoming debts, recurring bills) and generates notifications.
- **`FinancialNotificationController`**: Exposes `/unread`, `/mark-read/:id`, and `POST /run-smart-alerts`.

## Business and Data Flows
1. Daily cron triggers `runDailySmartAlerts()`.
2. The service scans account budgets and upcoming bill due dates.
3. If an alert condition is detected, it checks `dedupeKey` to avoid sending duplicate warnings on the same day.
4. User queries `GET /financial-notification/unread` in UI or marks alerts read via `POST /mark-read/:id`.

## Data Model and Relationships
- Belongs to `AccountEntity` via `accountId` (onDelete: CASCADE).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`.
- **Domain**: `AccountModule`, `FinancialCategoryModule`, `FinancialDebtModule`, `FinancialRecurringModule`.

## Existing Patterns and Conventions
- Uses `dedupeKey` string to ensure idempotency across recurring cron runs.
- JSON metadata field `metadata?: Record<string, unknown>` stores entity IDs for in-app navigation.

## Extension Guide
- To support push notifications (e.g., Firebase Cloud Messaging / WebPush), inject a push service into `FinancialNotificationService.createNotification()`.

## Constraints and Common Pitfalls
- Dedupe keys should incorporate date identifiers (e.g. `budget_exceeded_cat_12_2026_10`) to prevent blocking alerts in future periods.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify type safety.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-notification/financial-notification.controller.ts`
  - `src/module/financial/financial-notification/financial-notification.service.ts`
  - `src/module/financial/financial-notification/financial-notification.cron.ts`
  - `src/module/financial/financial-notification/_entities/financial-notification.entity.ts`
- Known Gaps: None.
