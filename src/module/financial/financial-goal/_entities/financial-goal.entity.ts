import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

import {
  FINANCIAL_GOAL_SAVING_MODE,
  FINANCIAL_GOAL_STATUS,
  FINANCIAL_GOAL_TYPE,
} from "../financial-goal.enum";

import { FinancialGoalHistoryEntity } from "../financial-goal-history/_entities/financial-goal-history.entity";

@Entity("financial-goal")
@ApiEntity()
export class FinancialGoalEntity extends BaseEntity {
  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  @IsString()
  name: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @Column({
    type: "enum",
    enum: FINANCIAL_GOAL_TYPE,
    nullable: false,
    default: FINANCIAL_GOAL_TYPE.OTHER,
  })
  @IsEnum(FINANCIAL_GOAL_TYPE)
  type: FINANCIAL_GOAL_TYPE;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @IsNumber()
  targetAmount: number;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: false,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @IsNumber()
  currentAmount: number;

  /**
   * MANUAL:
   * User tự nhập contribution
   *
   * AUTO:
   * Cron tự tạo contribution theo lịch
   */
  @Column({
    type: "enum",
    enum: FINANCIAL_GOAL_SAVING_MODE,
    nullable: false,
    default: FINANCIAL_GOAL_SAVING_MODE.MANUAL,
  })
  @IsEnum(FINANCIAL_GOAL_SAVING_MODE)
  savingMode: FINANCIAL_GOAL_SAVING_MODE;

  @Column({
    type: "enum",
    enum: FINANCIAL_GOAL_STATUS,
    nullable: false,
    default: FINANCIAL_GOAL_STATUS.ACTIVE,
  })
  @IsEnum(FINANCIAL_GOAL_STATUS)
  status: FINANCIAL_GOAL_STATUS;

  @Column({
    type: "timestamptz",
    nullable: true,
  })
  @IsOptional()
  deadline?: Date | null;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  /**
   * Số tiền tự động cộng mỗi kỳ
   */
  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  @IsOptional()
  @IsNumber()
  autoContributionAmount?: number | null;

  /**
   * Ngày chạy auto contribution trong tháng
   * 1 - 31
   */
  @Column({
    type: "int",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  autoContributionDay?: number | null;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
  })
  isLocked: boolean;

  @ManyToOne(() => AccountEntity, (account) => account.financialGoals, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @ApiPropertyOptional({
    type: () => AccountEntity,
    default: "Account",
  })
  account: AccountEntity;

  @Column({ type: "int", nullable: false })
  @IsNumber()
  accountId: number;

  @OneToMany(() => FinancialGoalHistoryEntity, (history) => history.goal, {
    cascade: true,
  })
  @ApiPropertyOptional({
    type: () => [FinancialGoalHistoryEntity],
    default: [],
  })
  histories: FinancialGoalHistoryEntity[];
}
