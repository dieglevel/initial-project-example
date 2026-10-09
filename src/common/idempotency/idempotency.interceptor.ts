import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { Request, Response } from "express";
import type { JwtPayload } from "@/module/auth/payload.type";
import { IdempotencyService } from "./idempotency.service";
import { IDEMPOTENCY_KEY } from "./idempotency.decorator";
import type { IdempotencyEntity } from "./_entities/idempotency.entity";

/**
 * NestJS Idempotency Interceptor.
 *
 * Applied globally but only active on routes decorated with @UseIdempotency().
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Request header: Idempotency-Key: <uuid>                                 │
 * │                                                                         │
 * │ If missing on an idempotent route → 400 Bad Request                     │
 * │ If present                                                              │
 * │   ├─ New key        → process normally, store result                    │
 * │   ├─ Retry DONE     → return cached 201/200 response                    │
 * │   ├─ Retry FAILED   → re-process (delete old record, try again)         │
 * │   ├─ Body mismatch  → 409 Conflict                                      │
 * │   └─ Concurrent     → 409 Conflict                                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only apply to handlers explicitly decorated with @UseIdempotency()
    const useIdempotency = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!useIdempotency) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { user?: JwtPayload }>();
    const res = ctx.getResponse<Response>();

    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    // ── Require the header ──────────────────────────────────────────────────
    if (!idempotencyKey) {
      throw new BadRequestException(
        "Missing required header: Idempotency-Key. Please generate a UUID and include it.",
      );
    }

    const userId = req.user?.sub;
    if (!userId) {
      // Should not happen if AuthGuard runs first, but guard against it
      throw new BadRequestException("Cannot determine user for idempotency check.");
    }

    const endpoint = IdempotencyService.endpointKey(req.method, req.path);
    const body = req.body as unknown;

    // Use switchMap to run async work before calling the handler
    return new Observable((subscriber) => {
      this.idempotencyService
        .check({ userId, key: idempotencyKey, endpoint, body })
        .then(({ isDuplicate, cachedResponse, record }) => {
          if (isDuplicate && cachedResponse) {
            // ── Replay cached response ──────────────────────────────────
            this.logger.log(
              `[Idempotency] REPLAY key=${idempotencyKey} userId=${userId}`,
            );
            res.setHeader("X-Idempotency-Replayed", "true");
            res.setHeader("Idempotency-Key", idempotencyKey);
            subscriber.next(cachedResponse.body);
            subscriber.complete();
            return;
          }

          // ── Process normally ────────────────────────────────────────
          res.setHeader("Idempotency-Key", idempotencyKey);

          next
            .handle()
            .pipe(
              switchMap(async (responseData) => {
                // Save the successful response
                const statusCode =
                  (res as Response & { statusCode?: number }).statusCode ??
                  HttpStatus.OK;

                if (record) {
                  await this.idempotencyService.complete({
                    record: record as IdempotencyEntity,
                    statusCode,
                    body: responseData as Record<string, unknown>,
                  });
                }

                return responseData;
              }),
              catchError((err) => {
                // Mark as failed so clients can retry
                if (record) {
                  this.idempotencyService
                    .markFailed(record as IdempotencyEntity)
                    .catch((e) =>
                      this.logger.error("Failed to mark idempotency as FAILED", e),
                    );
                }
                return throwError(() => err);
              }),
            )
            .subscribe(subscriber);
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }
}
