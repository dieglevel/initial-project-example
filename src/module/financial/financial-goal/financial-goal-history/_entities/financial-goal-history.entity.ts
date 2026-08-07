import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import {
  FINANCIAL_GOAL_HISTORY_SOURCE,
  FINANCIAL_GOAL_HISTORY_STATUS,
} from "../financial-goal-history.enum";
import { FinancialGoalEntity } from "../../_entities/financial-goal.entity";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";

@Entity("financial-goal-history")
export class FinancialGoalHistoryEntity extends BaseEntity {
  @Column()
  goalId: number;

  @ManyToOne(() => FinancialGoalEntity, (goal) => goal.histories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "goalId" })
  goal: FinancialGoalEntity;

  @Column()
  period: string;

  @Column("decimal", { precision: 15, scale: 2, default: 0 })
  plannedAmount: number;

  @Column("decimal", { precision: 15, scale: 2, default: 0 })
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

  @Column({ nullable: true })
  note: string;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;
}
