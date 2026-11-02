import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionDate1794000000000 implements MigrationInterface {
  name = "AddTransactionDate1794000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "financial-transaction"
      ADD COLUMN "transactionDate" date;
    `);

    await queryRunner.query(`
      UPDATE "financial-transaction"
      SET "transactionDate" = (
        "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
      )::date
      WHERE "transactionDate" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "financial-transaction"
      ALTER COLUMN "transactionDate" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_transaction_account_transactionDate"
      ON "financial-transaction" ("accountId", "transactionDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_financial_transaction_account_transactionDate";`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-transaction" DROP COLUMN "transactionDate";`,
    );
  }
}
