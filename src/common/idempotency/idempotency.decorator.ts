import { SetMetadata } from "@nestjs/common";

export const IDEMPOTENCY_KEY = "idempotency:use";

/**
 * Apply this decorator to any controller method that should be protected
 * by idempotency semantics.
 *
 * @example
 * ```ts
 * @Post('/create')
 * @UseIdempotency()
 * async create(@Body() dto: CreateDto, @CurrentUser() user: JwtPayload) { ... }
 * ```
 */
export const UseIdempotency = () => SetMetadata(IDEMPOTENCY_KEY, true);
