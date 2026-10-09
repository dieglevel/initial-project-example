import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import * as crypto from "crypto";
import {
  IdempotencyEntity,
  IDEMPOTENCY_STATUS,
} from "./_entities/idempotency.entity";

export interface IdempotencyCheckResult {
  /**
   * If true → the caller should use `cachedResponse` directly.
   * If false → the caller must process the request normally.
   */
  isDuplicate: boolean;
  cachedResponse?: {
    statusCode: number;
    body: Record<string, unknown>;
  };
  /** The newly created / existing record — used to update status later */
  record?: IdempotencyEntity;
}

/**
 * Core service that manages idempotency records.
 *
 * ─────────────────────────────────────────────
 * Flow:
 *  1. Interceptor calls `check()` before the handler runs.
 *  2. If a COMPLETED record exists → return cached response (retry).
 *  3. If a PROCESSING record exists → wait/return 409 (concurrent).
 *  4. If no record exists → insert PROCESSING record, run handler.
 *  5. After handler → call `complete()` to save response.
 *  6. On error → call `markFailed()`.
 * ─────────────────────────────────────────────
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @InjectRepository(IdempotencyEntity)
    private readonly idempotencyRepository: Repository<IdempotencyEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Compute a stable SHA-256 hash of the request body */
  hashBody(body: unknown): string {
    const normalized = JSON.stringify(body ?? {});
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /** Build an endpoint fingerprint: METHOD:path */
  static endpointKey(method: string, path: string): string {
    // Strip query strings for the fingerprint
    const cleanPath = path.split("?")[0];
    return `${method.toUpperCase()}:${cleanPath}`;
  }

  // ─── Main API ─────────────────────────────────────────────────────────────

  /**
   * Check whether a request is idempotent-duplicate and handle accordingly.
   *
   * ┌────────────────────┬──────────────────────────────────────────────────┐
   * │ Scenario           │ Behaviour                                        │
   * ├────────────────────┼──────────────────────────────────────────────────┤
   * │ New request        │ Insert PROCESSING record, return isDuplicate=false│
   * │ Retry (COMPLETED)  │ Return cached response, isDuplicate=true         │
   * │ Retry (FAILED)     │ Allow re-processing (delete old, insert new)     │
   * │ Concurrent         │ Throw 409 (PROCESSING record found)              │
   * │ Body mismatch      │ Throw 409 (Conflict)                             │
   * │ Expired record     │ Delete old, treat as new request                 │
   * └────────────────────┴──────────────────────────────────────────────────┘
   */
  async check(params: {
    userId: number;
    key: string;
    endpoint: string;
    body: unknown;
  }): Promise<IdempotencyCheckResult> {
    const { userId, key, endpoint, body } = params;
    const bodyHash = this.hashBody(body);

    return this.dataSource.transaction(async (manager) => {
      // Try to find an existing record — lock it for update to prevent races
      const existing = await manager
        .createQueryBuilder(IdempotencyEntity, "ir")
        .setLock("pessimistic_write")
        .where("ir.userId = :userId AND ir.key = :key", { userId, key })
        .getOne();

      // ── Case 1: Expired record ──────────────────────────────────────────
      if (existing && existing.expiresAt < new Date()) {
        this.logger.log(
          `Idempotency record expired for userId=${userId} key=${key}. Treating as new request.`,
        );
        await manager.remove(existing);
        const newRecord = await this.insertProcessingRecord(
          manager,
          userId,
          key,
          endpoint,
          bodyHash,
        );
        return { isDuplicate: false, record: newRecord };
      }

      // ── Case 2: Existing record ─────────────────────────────────────────
      if (existing) {
        // Body mismatch → Conflict
        if (existing.bodyHash !== bodyHash) {
          throw new ConflictException(
            "Idempotency key has already been used with a different request body",
          );
        }

        switch (existing.status) {
          case IDEMPOTENCY_STATUS.COMPLETED:
            this.logger.log(
              `Idempotency cache HIT for userId=${userId} key=${key}`,
            );
            return {
              isDuplicate: true,
              cachedResponse: {
                statusCode: existing.responseStatus ?? HttpStatus.OK,
                body: existing.responseBody ?? {},
              },
              record: existing,
            };

          case IDEMPOTENCY_STATUS.PROCESSING:
            // Concurrent request with the same key
            throw new ConflictException(
              "A request with this Idempotency-Key is already being processed. Please retry after a moment.",
            );

          case IDEMPOTENCY_STATUS.FAILED:
            // Policy: allow retry of failed requests
            this.logger.log(
              `Idempotency FAILED record found for userId=${userId} key=${key}. Allowing retry.`,
            );
            await manager.remove(existing);
            const retryRecord = await this.insertProcessingRecord(
              manager,
              userId,
              key,
              endpoint,
              bodyHash,
            );
            return { isDuplicate: false, record: retryRecord };
        }
      }

      // ── Case 3: New request ─────────────────────────────────────────────
      const newRecord = await this.insertProcessingRecord(
        manager,
        userId,
        key,
        endpoint,
        bodyHash,
      );
      return { isDuplicate: false, record: newRecord };
    });
  }

  /** Mark a record as COMPLETED and store the response. */
  async complete(params: {
    record: IdempotencyEntity;
    statusCode: number;
    body: Record<string, unknown>;
  }) {
    const { record, statusCode, body } = params;
    await this.idempotencyRepository.update(record.id, {
      status: IDEMPOTENCY_STATUS.COMPLETED,
      responseStatus: statusCode,
      responseBody: body,
    });
  }

  /** Mark a record as FAILED (non-retriable errors will be cleaned up by policy). */
  async markFailed(record: IdempotencyEntity) {
    await this.idempotencyRepository.update(record.id, {
      status: IDEMPOTENCY_STATUS.FAILED,
    });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async insertProcessingRecord(
    manager: import("typeorm").EntityManager,
    userId: number,
    key: string,
    endpoint: string,
    bodyHash: string,
  ): Promise<IdempotencyEntity> {
    const record = manager.create(IdempotencyEntity, {
      userId,
      key,
      endpoint,
      bodyHash,
      status: IDEMPOTENCY_STATUS.PROCESSING,
    });
    return manager.save(record);
  }
}
