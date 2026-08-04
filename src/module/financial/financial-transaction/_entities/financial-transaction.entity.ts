import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import {
  Column,
  Entity,
  IsNull,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from "typeorm";
import {
  FINANCIAL_TRANSACTION_STATUS,
  FINANCIAL_TRANSACTION_TYPE,
} from "../financial-transaction.enum";
import { FinancialWalletEntity } from "../../financial-wallet/_entities/financial-wallet.entity";
import { FinancialCategoryEntity } from "../../financial-category/_entities/financial-category.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { FinancialAdvanceTransactionEntity } from "../financial-advance-transaction/_entities/financial-advance-transaction.entity";

@Entity("financial-transaction")
@ApiEntity()
export class FinancialTransactionEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: true })
  @IsString()
  description?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsString()
  @IsOptional()
  merchant?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsString()
  @IsOptional()
  location?: string | null;

  @Column({ type: "simple-array", nullable: true })
  @IsArray()
  @IsOptional()
  tags?: string[] | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  @IsString()
  @IsOptional()
  receiptImageUrl?: string | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @IsNumber()
  amount: number;

  @Column({ type: "enum", enum: FINANCIAL_TRANSACTION_TYPE, nullable: false })
  @IsEnum(FINANCIAL_TRANSACTION_TYPE)
  type: FINANCIAL_TRANSACTION_TYPE;

  @Column({
    type: "enum",
    enum: FINANCIAL_TRANSACTION_STATUS,
    nullable: true,
    default: FINANCIAL_TRANSACTION_STATUS.PENDING,
  })
  @IsEnum(FINANCIAL_TRANSACTION_STATUS)
  status: FINANCIAL_TRANSACTION_STATUS;

  @ManyToOne(() => FinancialWalletEntity, (wallet) => wallet.transactions, {
    nullable: false,
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "walletId" })
  @ApiPropertyOptional({
    type: () => FinancialWalletEntity,
    default: "FinancialWallet",
  })
  wallet: FinancialWalletEntity;

  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  walletId?: number;

  @ManyToOne(
    () => FinancialTransactionEntity,
    (transaction) => transaction.refundTransactions,
    {
      nullable: true,
      onDelete: "SET NULL",
    },
  )
  @JoinColumn({ name: "originalTransactionId" })
  @IsOptional()
  originalTransaction?: FinancialTransactionEntity;

  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  originalTransactionId?: number | null;

  @OneToMany(
    () => FinancialTransactionEntity,
    (transaction) => transaction.originalTransaction,
  )
  refundTransactions?: FinancialTransactionEntity[];

  @ManyToOne(() => AccountEntity, (account) => account.financialTransactions, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @ApiPropertyOptional({
    type: () => AccountEntity,
    default: "Account",
  })
  account: AccountEntity;

  @OneToMany(
    () => FinancialAdvanceTransactionEntity,
    (advanceTransaction) => advanceTransaction.transaction,
  )
  @ApiPropertyOptional({
    type: () => FinancialAdvanceTransactionEntity,
    default: "FinancialAdvanceTransaction",
  })
  financialAdvanceTransactions?: FinancialAdvanceTransactionEntity[];
}
