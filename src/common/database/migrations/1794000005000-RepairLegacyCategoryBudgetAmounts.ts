import { MigrationInterface, QueryRunner } from "typeorm";

export class RepairLegacyCategoryBudgetAmounts1794000005000 implements MigrationInterface {
  name = "RepairLegacyCategoryBudgetAmounts1794000005000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "financial-category-budget" budget
      SET
        "amount" = category."monthlyBudget",
        "updatedAt" = NOW()
      FROM "financial-category" category
      WHERE budget."categoryId" = category.id
        AND budget."amount" IS NULL
        AND category."monthlyBudget" IS NOT NULL
        AND category."deletedAt" IS NULL;
    `);

    await queryRunner.query(`
      INSERT INTO "financial-category-budget" (
        "categoryId",
        "month",
        "amount",
        "createdAt",
        "updatedAt"
      )
      SELECT
        category.id,
        TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM'),
        category."monthlyBudget",
        NOW(),
        NOW()
      FROM "financial-category" category
      WHERE category."deletedAt" IS NULL
        AND category.archived = false
      ON CONFLICT ("categoryId", "month") DO NOTHING;
    `);
  }

  public async down(): Promise<void> {
    // Legacy values are intentionally retained on rollback.
  }
}
