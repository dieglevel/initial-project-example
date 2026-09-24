import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import {
  FINANCIAL_DEBT_DIRECTION_ENUM,
  FINANCIAL_DEBT_STATUS_ENUM,
  FINANCIAL_DEBT_TYPE_ENUM,
} from "../financial-debt.enum";
import { FinancialDebtHistoryEntity } from "./financial-debt-history.entity";
import { DecimalTransformer } from "@/common/util/decimal-transformer";

@Entity("financial-debt")
@Index(["accountId", "status"])
@ApiEntity()
export class FinancialDebtEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  namePerson: string;

  @Column({ type: "enum", enum: FINANCIAL_DEBT_TYPE_ENUM })
  type: FINANCIAL_DEBT_TYPE_ENUM;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    transformer: DecimalTransformer,
  })
  originalAmount: number;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    transformer: DecimalTransformer,
  })
  outstandingAmount: number;

  /** "YYYY-MM-DD" */
  @Column({ type: "date" })
  startDate: string;

  /** "YYYY-MM-DD" */
  @Column({ type: "date", nullable: true })
  dueDate?: string | null;

  @Column({ type: "enum", enum: FINANCIAL_DEBT_STATUS_ENUM })
  status: FINANCIAL_DEBT_STATUS_ENUM;

  @Column({ type: "enum", enum: FINANCIAL_DEBT_DIRECTION_ENUM })
  direction: FINANCIAL_DEBT_DIRECTION_ENUM;

  @Column({ type: "varchar", length: 500, nullable: true })
  description?: string | null;

  @Column({ type: "int" })
  accountId: number;

  @ManyToOne(() => AccountEntity, (account) => account.financialDebts, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "accountId" })
  account: AccountEntity;

  @OneToMany(() => FinancialDebtHistoryEntity, (history) => history.debt)
  histories?: FinancialDebtHistoryEntity[];
}
