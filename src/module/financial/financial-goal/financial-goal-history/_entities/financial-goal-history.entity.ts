import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import {
  FINANCIAL_GOAL_HISTORY_SOURCE,
  FINANCIAL_GOAL_HISTORY_STATUS,
  FINANCIAL_GOAL_HISTORY_TYPE,
} from "../financial-goal-history.enum";
import { FinancialGoalEntity } from "../../_entities/financial-goal.entity";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { DecimalTransformer } from "@/common/util/decimal-transformer";
import { FinancialWalletEntity } from "../../../financial-wallet/_entities/financial-wallet.entity";

/**
 * Mỗi kỳ (period) chỉ có tối đa 1 dòng góp tự động (source SYSTEM) cho một mục tiêu
 * — chặn cron tạo trùng khi chạy lại / chạy song song.
 */
@Index("UQ_goal_history_system_period", ["goalId", "period"], {
  unique: true,
  where: `"source" = 'SYSTEM' AND "deletedAt" IS NULL`,
})
@Entity("financial-goal-history")
export class FinancialGoalHistoryEntity extends BaseEntity {
  @Column()
  goalId: number;

  @ManyToOne(() => FinancialGoalEntity, (goal) => goal.histories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "goalId" })
  goal: FinancialGoalEntity;

  /** Kỳ "YYYY-MM" (giờ Việt Nam) */
  @Column()
  period: string;

  /** Góp vào hay rút ra. amount luôn dương, chiều nằm ở type */
  @Column({
    type: "enum",
    enum: FINANCIAL_GOAL_HISTORY_TYPE,
    default: FINANCIAL_GOAL_HISTORY_TYPE.CONTRIBUTION,
  })
  type: FINANCIAL_GOAL_HISTORY_TYPE;

  /** Số dự kiến (góp tự động); với góp tay = amount */
  @Column("decimal", {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: DecimalTransformer,
  })
  plannedAmount: number;

  /** Số thực tế đã áp vào mục tiêu (0 khi PENDING / SKIPPED) */
  @Column("decimal", {
    precision: 15,
    scale: 2,
    default: 0,
    transformer: DecimalTransformer,
  })
  amount: number;

  @Column({
    type: "enum",
    enum: FINANCIAL_GOAL_HISTORY_SOURCE,
    default: FINANCIAL_GOAL_HISTORY_SOURCE.USER,
  })
  source: FINANCIAL_GOAL_HISTORY_SOURCE;

  @Column({
    type: "enum",
    enum: FINANCIAL_GOAL_HISTORY_STATUS,
    default: FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED,
  })
  status: FINANCIAL_GOAL_HISTORY_STATUS;

  /** Ví bị trừ (góp) / được cộng (rút). null = chỉ ghi sổ, không đụng ví */
  @Column({ type: "int", nullable: true })
  walletId?: number | null;

  @ManyToOne(() => FinancialWalletEntity, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "walletId" })
  wallet?: FinancialWalletEntity | null;

  @Column({ nullable: true })
  note: string;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;
}
