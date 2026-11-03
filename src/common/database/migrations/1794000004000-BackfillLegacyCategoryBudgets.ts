import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillLegacyCategoryBudgets1794000004000 implements MigrationInterface {
  name = "BackfillLegacyCategoryBudgets1794000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        months.month,
        category."monthlyBudget",
        NOW(),
        NOW()
      FROM "financial-category" category
      CROSS JOIN LATERAL (
        SELECT TO_CHAR(month_series.month, 'YYYY-MM') AS month
        FROM generate_series(
          COALESCE(
            (
              SELECT DATE_TRUNC('month', MIN(transaction."transactionDate"))
              FROM "financial-transaction-item" item
              INNER JOIN "financial-transaction" transaction
                ON transaction.id = item."transactionId"
              WHERE item."categoryId" = category.id
                AND item."deletedAt" IS NULL
                AND transaction."deletedAt" IS NULL
            ),
            DATE_TRUNC('month', CURRENT_DATE)
          ),
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month_series(month)
      ) months
      WHERE category."deletedAt" IS NULL
        AND category.archived = false
      ON CONFLICT ("categoryId", "month") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Existing budget rows are intentionally preserved on rollback.
  }
}
