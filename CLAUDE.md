# CLAUDE.md — Claude Code-Specific Instructions

> This file extends `AGENTS.md` with Claude Code-specific setup. All shared rules, workflows, and conventions are defined in `AGENTS.md` — do not duplicate them here.

## Setup

1. Read `AGENTS.md` first for all shared instructions.
2. Read `docs/ai/PROJECT_CONTEXT.md` for project orientation.
3. Use `docs/ai/modules/INDEX.md` to navigate to relevant module documentation.

## Claude-Specific Notes

- This is a **NestJS 11** backend using **TypeORM**, **PostgreSQL**, and **JWT** authentication.
- The path alias `@/` resolves to `src/` — use it consistently in imports.
- The project uses `pnpm` as the package manager (see `pnpm-lock.yaml`).
- Build with `pnpm run build` (uses SWC compiler via NestJS CLI).
- Dev server: `pnpm run start:dev:local` (uses `.env.local`).
- Tests: `pnpm run test` (Jest).

## Key Context Files to Read First

For any task, these are the most efficient entry points:

1. `AGENTS.md` — Universal instructions
2. `docs/ai/PROJECT_CONTEXT.md` — Project overview
3. `docs/ai/core/CORE_OVERVIEW.md` — Core infrastructure
4. `docs/ai/modules/INDEX.md` — Module finder
5. `SESSION_LOG.md` — Current state (if exists)
