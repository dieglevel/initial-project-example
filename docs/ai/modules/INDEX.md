# Module Index

Searchable index of all analyzed modules. Use this to find the relevant documentation before inspecting source code.

## Core / Infrastructure Modules

| Module | Responsibility | Documentation | Entry Point | Dependencies | Core Components |
|---|---|---|---|---|---|
| Auth | JWT authentication, token management, multi-device support | [auth.md](auth.md) | `src/module/auth/auth.module.ts` | AccountModule, JwtModule | AuthGuard, AuthService, token storage |
| Account | User registration, password management | [account.md](account.md) | `src/module/account/account.module.ts` | Profile entity | AccountService |
| Profile | User profile CRUD | [profile.md](profile.md) | `src/module/profile/profile.module.ts` | Account entity, FileEntity | ProfileService |
| Static File | File upload, storage, cleanup | [static-file.md](static-file.md) | `src/module/static-file/static-file.module.ts` | None | StaticFileService, FileCleanupCron, LocalDiskAdapter |
| Feedback | User feedback, bug reports with images | [feedback.md](feedback.md) | `src/module/feedback/feedback.module.ts` | FileEntity, AccountEntity | FeedbackService, FeedbackController |

## Financial Domain Modules

| Module | Responsibility | Documentation | Entry Point | Key Dependencies | Core Components |
|---|---|---|---|---|---|
| Financial (parent) | Aggregates all financial sub-modules | [financial.md](financial.md) | `src/module/financial/financial.module.ts` | All sub-modules below | — |
| Financial Category | Income/expense category management, hierarchical | [financial-category.md](financial-category.md) | `src/module/financial/financial-category/` | Account | BaseCrudService, CreateGenericController |
| Financial Wallet | Wallet/account management, balance tracking | [financial-wallet.md](financial-wallet.md) | `src/module/financial/financial-wallet/` | Account | BaseCrudService, CreateGenericController |
| Financial Transaction | Transaction recording with idempotency | [financial-transaction.md](financial-transaction.md) | `src/module/financial/financial-transaction/` | Wallet, Category, Account, Idempotency | BaseCrudService, CreateGenericController |
| Financial Wallet Transfer | Inter-wallet money transfers | [financial-wallet-transfer.md](financial-wallet-transfer.md) | `src/module/financial/financial-wallet-transfer/` | Wallet | — |
| Financial Goal | Savings goals tracking | [financial-goal.md](financial-goal.md) | `src/module/financial/financial-goal/` | Account | BaseCrudService, Cron |
| Financial Recurring | Recurring transaction automation | [financial-recurring.md](financial-recurring.md) | `src/module/financial/financial-recurring/` | Account, Transaction | BaseCrudService, Cron |
| Financial Notification | Smart alerts and notifications | [financial-notification.md](financial-notification.md) | `src/module/financial/financial-notification/` | Account | BaseCrudService, Cron |
| Financial Report | Analytics and reporting | [financial-report.md](financial-report.md) | `src/module/financial/financial-report/` | Transaction, Wallet, Category | — |
| Financial Dashboard | Dashboard aggregations | [financial-dashboard.md](financial-dashboard.md) | `src/module/financial/financial-dashboard/` | Various financial modules | — |
| Financial Record | Bank transaction ingestion | [financial-record.md](financial-record.md) | `src/module/financial/financial-record/` | Wallet | Bank adapters |
| Financial Debt | Debt tracking and history | [financial-debt.md](financial-debt.md) | `src/module/financial/financial-debt/` | Account | BaseCrudService |
| Financial Setting | Per-user financial preferences | [financial-setting.md](financial-setting.md) | `src/module/financial/financial-setting/` | Account | BaseCrudService |

## Utility / Operational Modules

| Module | Responsibility | Documentation | Entry Point |
|---|---|---|---|
| Health Check | Health endpoint | — | `src/module/health-check/` |
| System Information | Server system metrics | — | `src/module/system-information/` |
| Telemetry | OpenTelemetry dashboard | — | `src/telemetry/` |
| Gateway (WebSocket) | Real-time communication (disabled) | — | `src/gateway/` |

---

**How to use**: Find your target module → read its documentation → inspect the entry-point source → follow imports for deeper context.
