import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import {
  IsBoolean,
  IsDecimal,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { FinancialTransactionEntity } from "../../financial-transaction/_entities/financial-transaction.entity";

@Entity("financial-category")
@ApiEntity()
export class FinancialCategoryEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @Column({ name: "icon", type: "varchar", nullable: true })
  @IsString()
  @IsNotEmpty()
  icon: string | null;

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
  monthlyBudget: number;

  @Column({ type: "boolean", nullable: false, default: false })
  @IsBoolean()
  archived: boolean;

  @OneToMany(
    () => FinancialTransactionEntity,
    (transaction) => transaction.category,
    {
      nullable: true,
      onDelete: "SET NULL",
    },
  )
  transactions?: FinancialTransactionEntity[];

  @ManyToOne(() => AccountEntity, (account) => account.financialCategories, {
    nullable: false,
    onDelete: "CASCADE",
  })
  account: AccountEntity;
}
