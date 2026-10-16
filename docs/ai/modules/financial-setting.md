# Module: Financial Setting

## Purpose
Manages per-user financial preferences including UI themes, display currency, application language, and customized monthly financial billing cycle start dates.

## Responsibilities and Boundaries
- Retrieve (`GET /financial-setting`) and update (`PATCH /financial-setting`) preferences for authenticated users.
- Configure `cycleStartDate` (day of month 1-31), which governs period calculations across the dashboard and reports.
- Configure default currency (`FINANCIAL_SETTING_CURRENCY` - VND, USD, etc.).
- Configure theme and themeMode (`LIGHT`, `DARK`, `AUTO`, `HUTAO`, etc.).
- Ensure a 1-to-1 relationship with `AccountEntity`.

## Source Map
```
src/module/financial/financial-setting/
├── financial-setting.controller.ts       # REST controller (GET, PATCH)
├── financial-setting.service.ts          # Preferences management service
├── financial-setting.module.ts           # Module definition
├── financial-setting.enum.ts             # CURRENCY, LANGUAGE, THEME, THEME_MODE
├── _entities/
│   └── financial-setting.entity.ts       # TypeORM entity
└── dto/
    ├── get.dto.ts
    └── update.dto.ts
```

## Main Components
- **`FinancialSettingEntity`**: 1-to-1 with `AccountEntity`, storing `themeMode`, `theme`, `cycleStartDate`, `language`, and `currency`.
- **`FinancialSettingService`**: Handles fetching and patch-updating user settings, auto-initializing defaults if not found.
- **`FinancialSettingController`**: Exposes `GET /financial-setting` and `PATCH /financial-setting`.

## Business and Data Flows
1. User logs in and fetches settings to initialize client styling and currency formatting.
2. User updates billing cycle start date (e.g. set to 15th of the month).
3. `FinancialDashboardService` and `FinancialReportService` read `cycleStartDate` to compute user-specific monthly financial ranges.

## Data Model and Relationships
- One-to-One with `AccountEntity` (onDelete: CASCADE).
- Foreign key `accountId` is unique.

## Dependencies and Integrations
- **Core**: `BaseEntity`.
- **Domain**: `AccountModule`. Consumed by `FinancialDashboardModule` and `FinancialReportModule`.

## Existing Patterns and Conventions
- Uses `PATCH` verb for partial preference updates.
- Wrapped in standard `ApiBaseResponse` envelope.

## Extension Guide
- To add notification preferences (e.g., enable daily digest, email notifications), add boolean toggle columns to `FinancialSettingEntity` and update `FinancialSetting_Update_Request`.

## Constraints and Common Pitfalls
- `cycleStartDate` must be between 1 and 31.
- Never allow one user to view or modify another user's financial setting.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify types.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-setting/financial-setting.controller.ts`
  - `src/module/financial/financial-setting/financial-setting.service.ts`
  - `src/module/financial/financial-setting/_entities/financial-setting.entity.ts`
  - `src/module/financial/financial-setting/financial-setting.enum.ts`
- Known Gaps: None.
