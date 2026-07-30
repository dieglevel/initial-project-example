import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { FinancialTransactionEntity } from "../../financial-transaction/_entities/financial-transaction.entity";
import { IsDecimal, IsNumber, IsString } from "class-validator";
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
