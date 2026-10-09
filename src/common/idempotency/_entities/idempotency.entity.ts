import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum IDEMPOTENCY_STATUS {
  /** Request is currently being processed (in-flight) */
  PROCESSING = "PROCESSING",
  /** Request completed successfully */
  COMPLETED = "COMPLETED",
  /** Request failed with a non-retriable error */
  FAILED = "FAILED",
}

/**
 * Idempotency record table.
 *
 * Unique constraint on (userId, key) ensures that:
 *  - The same user cannot submit two different idempotent operations under the same key.
 *  - A retry from the same user with the same key is detected and the cached response is returned.
 */
@Entity("idempotency_record")
@Index("IDX_idempotency_user_key", ["userId", "key"], { unique: true })
export class IdempotencyEntity {
  @PrimaryGeneratedColumn("identity")
  id: number;

  /**
   * The account / user who owns this idempotency record.
   * Stored as plain integer FK to avoid circular imports.
   */
  @Column({ type: "int", nullable: false })
  userId: number;

  /**
   * The client-supplied UUID idempotency key.
   */
  @Column({ type: "varchar", length: 64, nullable: false })
  key: string;

  /**
   * HTTP method + path fingerprint to detect body mismatches.
   * E.g. "POST:/financial-transaction/create"
   */
  @Column({ type: "varchar", length: 255, nullable: false })
  endpoint: string;

  /**
   * SHA-256 hash of the request body so we can detect body mismatches
   * (same key but different body → 409 Conflict).
   */
  @Column({ type: "varchar", length: 64, nullable: false })
  bodyHash: string;

  /** Current processing status */
  @Column({
    type: "enum",
    enum: IDEMPOTENCY_STATUS,
    default: IDEMPOTENCY_STATUS.PROCESSING,
  })
  status: IDEMPOTENCY_STATUS;

  /**
   * The HTTP status code of the completed/failed response.
   * NULL while status = PROCESSING.
   */
  @Column({ type: "int", nullable: true })
  responseStatus?: number | null;

  /**
   * Serialised JSON of the response body to replay on retry.
   * NULL while status = PROCESSING.
   */
  @Column({ type: "jsonb", nullable: true })
  responseBody?: Record<string, unknown> | null;

  /**
   * Auto-expiry: records older than this are treated as expired
   * and a fresh request is allowed.
   *
   * Default: 24 hours from creation.
   */
  @Column({
    type: "timestamptz",
    nullable: false,
    default: () => "NOW() + INTERVAL '24 hours'",
  })
  expiresAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
