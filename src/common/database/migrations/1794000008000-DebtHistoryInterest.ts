import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Financial debt history: INTEREST — phần thu / trả vượt dư nợ (tiền lãi).
 */
export class DebtHistoryInterest1794000008000 implements MigrationInterface {
  name = "DebtHistoryInterest1794000008000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."financial-debt-history_type_enum" ADD VALUE IF NOT EXISTS 'INTEREST'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres không hỗ trợ xóa giá trị enum.
  }
}
