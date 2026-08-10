import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { FinancialTransactionEntity } from "../../financial-transaction/_entities/financial-transaction.entity";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { FINANCIAL_WALLET_TYPE } from "../financial-wallet.enum";
import { AccountEntity } from "@/module/account/_entities/account.entity";

@Entity("financial-wallet")
@ApiEntity()
export class FinancialWalletEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  name: string;

  @Column({ type: "enum", enum: FINANCIAL_WALLET_TYPE, nullable: false })
  @IsString()
  type: FINANCIAL_WALLET_TYPE;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @IsNumber()
  balance: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  icon: string;

  @Column({ type: "varchar", length: 7, nullable: false })
  @IsString()
  color: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsString()
  @IsOptional()
  institutionName?: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  @IsString()
  @IsOptional()
  accountNumberMasked?: string | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  @IsNumber()
  @IsOptional()
  creditLimit?: number | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  @IsNumber()
  @IsOptional()
  currentDebt?: number | null;

  @Column({ type: "int", nullable: true })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  statementDay?: number | null;

  @Column({ type: "int", nullable: true })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number | null;

  @Column({ type: "boolean", nullable: false, default: false })
  isLockedForDailySpending: boolean;

  @OneToMany(
    () => FinancialTransactionEntity,
    (transaction) => transaction.wallet,
  )
  @ApiPropertyOptional({
    type: () => FinancialTransactionEntity,
    default: "FinancialTransaction",
  })
  transactions: FinancialTransactionEntity[];

  @ManyToOne(() => AccountEntity, (account) => account.wallets, {
    nullable: false,
  })
  @JoinColumn({ name: "accountId" })
  @ApiPropertyOptional({
    type: () => AccountEntity,
    default: "Account",
  })
  account: AccountEntity;
}
