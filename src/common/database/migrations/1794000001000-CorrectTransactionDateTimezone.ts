import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The legacy createdAt column is timestamp without time zone, but the
 * application writes UTC values into it. Recalculate the new date-only field
 * in Vietnam time so transactions before 07:00 UTC keep their local date.
 */
export class CorrectTransactionDateTimezone1794000001000 implements MigrationInterface {
  name = "CorrectTransactionDateTimezone1794000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "financial-transaction"
      SET "transactionDate" = (
        "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
      )::date;
    `);
  }

  public async down(): Promise<void> {
    // The correction is a data backfill and has no reversible source value.
  }
}
