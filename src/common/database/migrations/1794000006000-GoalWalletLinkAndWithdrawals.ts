import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Financial goal:
 * - goal.walletId: ví mặc định cho góp tự động
 * - goal-history.walletId: ví bị trừ (góp) / được cộng (rút)
 * - goal-history.type: CONTRIBUTION | WITHDRAWAL
 * - Unique (goalId, period) cho dòng góp tự động (source SYSTEM) — chặn cron tạo trùng
 */
export class GoalWalletLinkAndWithdrawals1794000006000 implements MigrationInterface {
  name = "GoalWalletLinkAndWithdrawals1794000006000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."financial-goal-history_type_enum" AS ENUM('CONTRIBUTION', 'WITHDRAWAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal-history" ADD "type" "public"."financial-goal-history_type_enum" NOT NULL DEFAULT 'CONTRIBUTION'`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal-history" ADD "walletId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal" ADD "walletId" integer`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_goal_history_system_period" ON "financial-goal-history" ("goalId", "period") WHERE "source" = 'SYSTEM' AND "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal-history" ADD CONSTRAINT "FK_4ec1d6f17d1a9852123b06df71b" FOREIGN KEY ("walletId") REFERENCES "financial-wallet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal" ADD CONSTRAINT "FK_e55ab9ff6fe88cc453f8aa34cd0" FOREIGN KEY ("walletId") REFERENCES "financial-wallet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "financial-goal" DROP CONSTRAINT "FK_e55ab9ff6fe88cc453f8aa34cd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal-history" DROP CONSTRAINT "FK_4ec1d6f17d1a9852123b06df71b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_goal_history_system_period"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal" DROP COLUMN "walletId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal-history" DROP COLUMN "walletId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial-goal-history" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."financial-goal-history_type_enum"`,
    );
  }
}
