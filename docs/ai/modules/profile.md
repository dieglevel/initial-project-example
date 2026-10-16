# Module: Profile

## Purpose
User profile management (personal info, avatar).

## Responsibilities and Boundaries
- CRUD operations for user profile data.
- Avatar management via `FileEntity` relation.

## Source Map
```
src/module/profile/
├── profile.module.ts
├── profile.controller.ts
├── profile.service.ts
├── dto/
│   ├── me.dto.ts
│   └── update.dto.ts
└── _entities/
    └── profile.entity.ts
```

## Main Components

### `ProfileEntity`
- Extends `BaseEntity`.
- Columns: `firstName`, `lastName`, `dateOfBirth` (all nullable).
- Relations: `AccountEntity` (1:1, JoinColumn `accountId`), `FileEntity` as avatar (1:1, nullable, eager).

## Dependencies and Integrations
- `AccountEntity` — owning side with cascade delete.
- `FileEntity` — avatar image via `JoinColumn("avatarId")`.
- Created automatically by `AccountService.register()`.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths: `src/module/profile/`
- Known Gaps: Profile service and controller methods not deeply analyzed.
