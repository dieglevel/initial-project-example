# Module: Feedback

## Purpose
Provides user feedback, bug reporting, and feature suggestion capabilities. Anyone can submit feedback (anonymous or authenticated) with attached images (1-n) and system feature/page classification via select.

## Responsibilities and Boundaries
- Public submission endpoint (`POST /feedback`) accessible without authentication.
- Automatically link authenticated user accounts and prefill contact details if Bearer token is provided.
- Persist 1-to-N screenshot and image attachments via `feedback_files` join table with `FileEntity`.
- Convert attached temporary files (`isTemporary = true`) to permanent files (`isTemporary = false`) upon feedback submission.
- Classify feedback by system feature (`FEEDBACK_FEATURE`: `DASHBOARD`, `TRANSACTION`, `WALLET`, etc.) and type (`BUG`, `FEATURE_REQUEST`, `IMPROVEMENT`, `OTHER`).
- Administrative paginated viewing, detail inspection, and status management (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`).

## Source Map
```
src/module/feedback/
├── feedback.module.ts                    # NestJS module definition
├── feedback.controller.ts                # Public submission & admin endpoints
├── feedback.service.ts                   # Feedback logic extending BaseCrudService
├── feedback.enum.ts                      # FEATURE, TYPE, STATUS enums
├── _entities/
│   └── feedback.entity.ts                # FeedbackEntity with files relation
└── dto/
    ├── create.dto.ts                     # Feedback_Create_Request / Response
    ├── update.dto.ts                     # Feedback_Update_Request / Response
    ├── paging.dto.ts                     # Feedback_Paging_Response
    ├── get-all.dto.ts                    # Feedback_GetAll_Response
    └── delete.dto.ts                     # Feedback_Delete_Response
```

## Main Components
- **`FeedbackEntity`**: Stores title, content, feature enum, type enum, status enum, contact email/name, optional `account` foreign key, and Many-to-Many `files` relation (`FileEntity[]`).
- **`FeedbackService`**: Implements `submitFeedback()` attaching uploaded files, pre-filling authenticated user info, and saving records.
- **`FeedbackController`**: Exposes `@Public()` `POST /feedback` plus protected `/paging`, `/:id`, `PATCH /:id/status`, and `DELETE /:id`.

## Business and Data Flows
1. User (or visitor) fills out feedback form on frontend:
   - Selects system feature (`feature`).
   - Selects feedback type (`type`).
   - Enters title and description.
   - Uploads 1 or more screenshots via `/static/upload`, obtaining file IDs.
2. Client sends payload to `POST /feedback`:
   - If user is logged in, Bearer token is inspected to link `accountId`.
   - Service loads `FileEntity` records by `fileIds` and sets `isTemporary = false`.
   - Saves `FeedbackEntity` with `status: PENDING`.
3. Administrators or users can inspect submitted feedbacks via `GET /feedback/paging`.

## Data Model and Relationships
- Many-to-Many with `FileEntity` via `feedback_files` join table.
- Many-to-One with `AccountEntity` (nullable: true, onDelete: SET NULL).

## Dependencies and Integrations
- **Core**: `BaseEntity`, `BaseCrudService`, `@Public()`.
- **Domain**: `StaticFileModule` (`FileEntity`), `AccountModule` (`AccountEntity`).

## Existing Patterns and Conventions
- Response wrapped in global `ResponseInterceptor`.
- Paging uses `ApiPagination` and `PaginationQuery<FeedbackEntity>`.

## Extension Guide
- To send instant Discord or Slack webhook notifications upon feedback submission, inject a notification service in `FeedbackService.submitFeedback()`.

## Constraints and Common Pitfalls
- Files must be uploaded to `/static/upload` first to obtain valid file IDs before calling `POST /feedback`.

## Tests and Verification
- Run `pnpm run build` to verify compilation.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-19
- Source Paths:
  - `src/module/feedback/feedback.controller.ts`
  - `src/module/feedback/feedback.service.ts`
  - `src/module/feedback/_entities/feedback.entity.ts`
- Known Gaps: None.
