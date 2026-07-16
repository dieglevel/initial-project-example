import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { FinancialWalletEntity } from "../../financial-wallet/_entities/financial-wallet.entity";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

@Entity("financial-wallet-transfer")
@ApiEntity()
export class FinancialWalletTransferEntity extends BaseEntity {
  @ManyToOne(() => FinancialWalletEntity, (wallet) => wallet.id, {
    nullable: false,
  })
  @ApiPropertyOptional({
    type: () => FinancialWalletEntity,
    default: "FinancialWalletEntity",
  })
  @IsNumber()
  fromWallet: FinancialWalletEntity;

  @ManyToOne(() => FinancialWalletEntity, (wallet) => wallet.id, {
    nullable: false,
  })
  @ApiPropertyOptional({
    type: () => FinancialWalletEntity,
    default: "FinancialWalletEntity",
  })
  @IsNumber()
  toWallet: FinancialWalletEntity;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: false })
  @IsNumber()
  amount: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: false })
  @IsNumber()
  transferFee: number;
}
