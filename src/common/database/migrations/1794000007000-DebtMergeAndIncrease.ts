import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Financial debt — gộp nhiều lần vay của cùng một người vào một khoản:
 * - debt.status: thêm MERGED (khoản nguồn đã gộp sang khoản khác)
 * - debt.mergedIntoId: id khoản đích
 * - debt-history.type: thêm INCREASED (vay thêm), MERGED_IN, MERGED_OUT
 */
export class DebtMergeAndIncrease1794000007000 implements MigrationInterface {
  name = "DebtMergeAndIncrease1794000007000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."financial-debt_status_enum" ADD VALUE IF NOT EXISTS 'MERGED'`,
    );
    for (const value of ["INCREASED", "MERGED_IN", "MERGED_OUT"]) {
      await queryRunner.query(
        `ALTER TYPE "public"."financial-debt-history_type_enum" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "financial-debt" ADD COLUMN IF NOT EXISTS "mergedIntoId" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres không hỗ trợ xóa giá trị enum; chỉ gỡ cột.
    await queryRunner.query(
      `ALTER TABLE "financial-debt" DROP COLUMN IF EXISTS "mergedIntoId"`,
    );
  }
}
