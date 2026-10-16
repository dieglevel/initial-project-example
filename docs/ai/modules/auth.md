# Module: Auth

## Purpose
JWT-based authentication with multi-device token management. Supports sign-in, logout, token refresh, and pluggable token storage backends.

## Responsibilities and Boundaries
- Authenticate users via username/email + password.
- Issue and manage access/refresh JWT token pairs.
- Validate tokens on every protected request (global guard).
- Support whitelist or blacklist token modes.
- Support database, Redis, or in-memory token storage.
- Does NOT manage user registration (that's Account module).

## Source Map
```
src/module/auth/
├── auth.module.ts                          # Module definition, DI for token storage
├── auth.controller.ts                      # Sign-in, logout, refresh endpoints
├── auth.service.ts                         # Core auth logic
├── auth.cache.ts                           # Token TTL constants
├── jwt.guard.ts                            # Global JWT guard (APP_GUARD)
├── payload.type.ts                         # JwtPayload = { sub: number }
├── decorator/
│   ├── current-user.decorator.ts           # @CurrentUser() param decorator
│   └── public.decorator.ts                 # @Public() route decorator
├── dto/
│   ├── sign-in.dto.ts                      # SignInDto, SignInDtoResponse
│   ├── log-out.dto.ts                      # LogOutDto, LogOutDtoResponse
│   └── refresh-token.dto.ts                # RefreshTokenDto, RefreshTokenDtoResponse
├── _entities/
│   └── auth-token.entity.ts                # AuthTokenEntity (for DB storage)
└── storage/
    ├── token-storage.interface.ts           # IJwtTokenStorageService interface
    ├── database-token-storage.service.ts    # DB implementation
    ├── memory-token-storage.service.ts      # Memory implementation
    └── redis-token-storage.service.ts       # Redis implementation
```

## Main Components

### `AuthGuard` (jwt.guard.ts)
- Global guard applied via `APP_GUARD`.
- Skips routes with `@Public()` metadata.
- Extracts Bearer token from `Authorization` header.
- Delegates to `AuthService.validateUser()` for token verification.

### `AuthService` (auth.service.ts)
- `signIn(data)`: Validates credentials, generates access+refresh tokens, stores in whitelist mode.
- `logOut(data)`: Removes tokens (whitelist) or blacklists them.
- `refreshToken(data)`: Verifies refresh token, rotates both tokens.
- `validateUser(token)`: Verifies JWT + checks token storage.

### Token Storage Interface
Injection token: `TOKEN_STORAGE_SERVICE`
```typescript
interface IJwtTokenStorageService {
  saveToken(userId, token, type, ttl, mode): Promise<void>;
  removeToken(userId, token, type, mode): Promise<void>;
  removeAllUserTokens?(userId): Promise<void>;
  validateToken(userId, token, type, mode): Promise<boolean>;
}
```

Token hash: MD5 of raw JWT string.

## Dependencies and Integrations
- **AccountModule**: Used for user lookup during sign-in.
- **JwtModule**: Global, injected from `InitialJwtModule`.
- **ConfigModule**: `jwtConfig` for token settings, `redisConfig` for Redis storage.

## Existing Patterns and Conventions
- Token storage driver selected via factory in `auth.module.ts` based on `AUTH_TOKEN_STORE_DRIVER`.
- `authAccessTokenCacheExpiresIn` and `authRefreshTokenCacheExpiresIn` define TTLs (see `auth.cache.ts`).

## Extension Guide
- To add a new token storage backend: implement `IJwtTokenStorageService` and add to the factory in `auth.module.ts`.
- To add OAuth/social login: extend `AuthService` with new methods and create corresponding DTOs.

## Constraints and Common Pitfalls
- Changing `JwtPayload` structure requires updating all `@CurrentUser()` consumers.
- Token hash uses MD5 — sufficient for lookup keys, not for security.
- WebSocket auth uses a separate `WsAuthGuard` in `src/gateway/ws.guard.ts`.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths: `src/module/auth/`
- Known Gaps: Token TTL values need verification from `auth.cache.ts`.
