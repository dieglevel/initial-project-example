# Module: Account

## Purpose
User account registration and password management.

## Responsibilities and Boundaries
- Register new users with email, username, and password.
- Change user passwords.
- Look up accounts by identifier (email or username) and by ID.
- Creates an associated `ProfileEntity` on registration.
- Does NOT handle authentication — that's the Auth module.

## Source Map
```
src/module/account/
├── account.module.ts
├── account.controller.ts
├── account.service.ts
├── dto/
│   ├── register.dto.ts          # RegisterDtoRequest, RegisterDtoResponse
│   └── change-password.dto.ts   # ChangePasswordDto, ChangePasswordDtoResponse
└── _entities/
    └── account.entity.ts        # AccountEntity
```

## Main Components

### `AccountEntity`
- Extends `BaseEntity`.
- Columns: `email` (unique), `username` (unique), `password` (select: false), `isVerified` (default: false).
- Relations: `ProfileEntity` (1:1, cascade, eager), all financial entities (1:N).

### `AccountService`
- `register(data)`: Transaction-based — creates account with hashed password + empty profile.
- `changePassword(user, data)`: Finds account by ID, hashes new password, saves.
- `findOne(identifier)`: Looks up by username OR email, includes password for auth.
- `findById(id)`: Looks up by ID, excludes password.

## Dependencies and Integrations
- `ProfileEntity` — created automatically on registration.
- Used by `AuthModule` for credential validation.
- `AccountEntity` is the central user entity — all financial modules reference it.

## Constraints and Common Pitfalls
- `password` column has `select: false` — must explicitly select it when needed (done in `findOne`).
- Registration uses `DataSource.transaction()` for atomicity.
- `isVerified` is set to `true` directly on registration (no email verification flow currently).

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths: `src/module/account/`
- Known Gaps: None identified.
