import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdNotificationToFinancialRecord1787716787334 implements MigrationInterface {
  name = "AddIdNotificationToFinancialRecord1787716787334";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "financial-record" ADD "idNotification" character varying(128)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_58cf0014b97801dd6c56c591de" ON "financial-record" ("idNotification") WHERE "idNotification" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58cf0014b97801dd6c56c591de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-record" DROP COLUMN "idNotification"`,
    );
  }
}
