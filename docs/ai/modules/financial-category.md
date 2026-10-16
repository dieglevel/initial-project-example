# Module: Financial Category

## Purpose
Manages user financial categories for classifying income and expenditure, supporting a hierarchical (parent/child) structure, monthly budgets, spending natures, and category archiving.

## Responsibilities and Boundaries
- Provide CRUD operations for categories belonging to authenticated accounts.
- Support hierarchical parent-child category tree structures.
- Track monthly budgets and spending natures (`ESSENTIAL`, `NON_ESSENTIAL`, etc.).
- Support category archiving without hard deletion.
- Calculate category-based transaction counts and summaries.

## Source Map
```
src/module/financial/financial-category/
├── financial-category.controller.ts      # REST controller extending CreateGenericController
├── financial-category.service.ts         # Business logic extending BaseCrudService
├── financial-category.module.ts          # Module definition
├── financial-category.enum.ts            # FINANCIAL_CATEGORY_TYPE, SPENDING_NATURE
├── _entities/
│   └── financial-category.entity.ts      # TypeORM entity
└── dto/
    ├── create.dto.ts
    ├── update.dto.ts
    ├── get-all.dto.ts
    ├── paging.dto.ts
    ├── delete.dto.ts
    ├── list.dto.ts
    ├── get-with-transaction-count.dto.ts
    └── get-transaction-category.dto.ts
```

## Main Components
- **`FinancialCategoryEntity`**: Persistent model with self-referencing `parent`/`children` relationships and `AccountEntity` ownership.
- **`FinancialCategoryService`**: Implements custom category tree queries, archive logic, and transaction association queries.
- **`FinancialCategoryController`**: Standard CRUD endpoints (`/paging`, `/:id`) plus `/list`, `/transaction/:categoryId`, `/archive/:categoryId`.

## Business and Data Flows
1. User creates a category: sets name, hex color, icon, type (`INCOME` or `EXPENSE`), optional `parentId`, and optional `monthlyBudget`.
2. Transactions link to categories via `FinancialTransactionItemEntity.categoryId`.
3. Archiving a category sets `archived = true`, hiding it from active pickers while preserving historical transactions.

## Data Model and Relationships
- Many-to-One with `AccountEntity` (onDelete: CASCADE).
- Self-referencing Many-to-One `parent` (onDelete: SET NULL) and One-to-Many `children`.
- One-to-Many with `FinancialTransactionItemEntity` (onDelete: SET NULL).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `CreateGenericController`.
- **Domain**: `AccountEntity`, `FinancialTransactionItemEntity`.

## Existing Patterns and Conventions
- Uses `CreateGenericController` factory for base CRUD routes.
- Decimals for `monthlyBudget` use custom transformer to ensure JavaScript numbers.
- Colors validated with `@IsHexColor()`.

## Extension Guide
- To add category-level rules (e.g., auto-categorization keywords), add columns to `FinancialCategoryEntity` and update `FinancialCategory_Create_Request` and `FinancialCategory_Update_Request`.

## Constraints and Common Pitfalls
- Deleting or archiving parent categories must handle child categories appropriately (TypeORM is configured with `SET NULL` on delete).
- Always ensure category queries filter by `account.id = user.sub` to prevent cross-account category leakage.

## Tests and Verification
- Run `pnpm run test` for unit tests.
- Run `pnpm run build` to verify type safety.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths:
  - `src/module/financial/financial-category/financial-category.controller.ts`
  - `src/module/financial/financial-category/financial-category.service.ts`
  - `src/module/financial/financial-category/_entities/financial-category.entity.ts`
  - `src/module/financial/financial-category/financial-category.enum.ts`
- Known Gaps: None.
