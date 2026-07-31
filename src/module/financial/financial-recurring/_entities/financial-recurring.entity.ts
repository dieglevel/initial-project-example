import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { FinancialCategoryEntity } from "../../financial-category/_entities/financial-category.entity";
import { FinancialWalletEntity } from "../../financial-wallet/_entities/financial-wallet.entity";
import {
  FINANCIAL_RECURRING_FREQUENCY,
  FINANCIAL_RECURRING_TYPE,
} from "../financial-recurring.enum";

type FinancialRecurringTransactionDirection = "income" | "expense";

@Entity("financial-recurring")
@ApiEntity()
export class FinancialRecurringEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  name: string;

  @Column({
    type: "enum",
    enum: FINANCIAL_RECURRING_TYPE,
    nullable: false,
    default: FINANCIAL_RECURRING_TYPE.OTHER,
  })
  @IsEnum(FINANCIAL_RECURRING_TYPE)
  recurringType: FINANCIAL_RECURRING_TYPE;

  @Column({
    type: "enum",
    enum: FINANCIAL_RECURRING_FREQUENCY,
    nullable: false,
    default: FINANCIAL_RECURRING_FREQUENCY.MONTHLY,
  })
  @IsEnum(FINANCIAL_RECURRING_FREQUENCY)
  frequency: FINANCIAL_RECURRING_FREQUENCY;

  @Column({
    type: "enum",
    enum: ["income", "expense"],
    nullable: false,
  })
  transactionType: FinancialRecurringTransactionDirection;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @IsNumber()
  amount: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  @IsString()
  merchant?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  @IsString()
  location?: string | null;

  @Column({ type: "simple-array", nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[] | null;

  @Column({ type: "int", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number | null;

  @Column({ type: "int", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number | null;

  @Column({ type: "timestamptz", nullable: false })
  nextRunAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  lastRunAt?: Date | null;

  @Column({ type: "boolean", nullable: false, default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ type: "boolean", nullable: false, default: true })
  @IsBoolean()
  isAutoCreate: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  @IsBoolean()
  reminderOnly: boolean;

  @ManyToOne(() => FinancialWalletEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "walletId" })
  wallet: FinancialWalletEntity;

  @Column({ nullable: false })
  @IsNumber()
  walletId: number;

  @ManyToOne(() => FinancialCategoryEntity, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category?: FinancialCategoryEntity | null;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @ManyToOne(
    () => AccountEntity,
    (account) => account.financialRecurringRules,
    {
      nullable: false,
      onDelete: "CASCADE",
    },
  )
  @ApiPropertyOptional({ type: () => AccountEntity, default: "Account" })
  account: AccountEntity;
}
