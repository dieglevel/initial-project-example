import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { FinancialTransactionEntity } from "../../financial-transaction/_entities/financial-transaction.entity";
import { IsDecimal, IsNumber, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

@Entity("financial-wallet")
@ApiEntity()
export class FinancialWalletEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  name: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  type: string;

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
  currency: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  icon: string;

  @OneToMany(
    () => FinancialTransactionEntity,
    (transaction) => transaction.wallet,
  )
  @ApiPropertyOptional({
    type: () => FinancialTransactionEntity,
    default: "FinancialTransaction",
  })
  transactions: FinancialTransactionEntity[];
}
