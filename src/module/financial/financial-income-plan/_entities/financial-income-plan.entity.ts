import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { DecimalTransformer } from "@/common/util/decimal-transformer";
import { IsNumber, IsString, Matches, Min } from "class-validator";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { AccountEntity } from "@/module/account/_entities/account.entity";

@Entity("income_plans")
@Index("UQ_income_plans_account_month", ["accountId", "month"], {
  unique: true,
})
@ApiEntity()
export class FinancialIncomePlanEntity extends BaseEntity {
  @Column({ type: "int" })
  @IsNumber()
  accountId: number;

  @ManyToOne(() => AccountEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "accountId" })
  account: AccountEntity;

  @Column({ type: "varchar", length: 7 })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: DecimalTransformer,
  })
  @IsNumber()
  @Min(0)
  expectedAmount: number;
}
