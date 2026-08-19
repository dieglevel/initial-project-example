import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { ProfileEntity } from "../../profile/_entities/profile.entity";
import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { FinancialCategoryEntity } from "@/module/financial/financial-category/_entities/financial-category.entity";
import { FinancialTransactionEntity } from "@/module/financial/financial-transaction/_entities/financial-transaction.entity";
import { FinancialWalletEntity } from "@/module/financial/financial-wallet/_entities/financial-wallet.entity";
import { FinancialGoalEntity } from "@/module/financial/financial-goal/_entities/financial-goal.entity";
import { FinancialRecurringEntity } from "@/module/financial/financial-recurring/_entities/financial-recurring.entity";
import { FinancialNotificationEntity } from "@/module/financial/financial-notification/_entities/financial-notification.entity";
import { FinancialDebtEntity } from "@/module/financial/financial-debt/_entities/financial-debt.entity";

@Entity()
@ApiEntity()
export class AccountEntity extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  @ApiProperty({ writeOnly: true })
  password: string;

  @Column({ default: false })
  @ApiPropertyOptional()
  isVerified: boolean;

  @OneToOne(() => ProfileEntity, (profile) => profile.account, {
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  @ApiPropertyOptional({ type: () => ProfileEntity, default: "Profile" })
  profile?: ProfileEntity;

  @OneToMany(
    () => FinancialCategoryEntity,
    (financialCategory) => financialCategory.account,
  )
  @ApiPropertyOptional({ type: () => [FinancialCategoryEntity], default: [] })
  financialCategories: FinancialCategoryEntity[];

  @OneToMany(
    () => FinancialTransactionEntity,
    (financialTransaction) => financialTransaction.account,
  )
  @ApiPropertyOptional({
    type: () => [FinancialTransactionEntity],
    default: [],
  })
  financialTransactions: FinancialTransactionEntity[];

  @OneToMany(
    () => FinancialWalletEntity,
    (financialWallet) => financialWallet.account,
  )
  @ApiPropertyOptional({ type: () => [FinancialWalletEntity], default: [] })
  wallets: FinancialWalletEntity[];

  @OneToMany(
    () => FinancialGoalEntity,
    (financialGoal) => financialGoal.account,
  )
  @ApiPropertyOptional({ type: () => [FinancialGoalEntity], default: [] })
  financialGoals: FinancialGoalEntity[];

  @OneToMany(
    () => FinancialRecurringEntity,
    (financialRecurring) => financialRecurring.account,
  )
  @ApiPropertyOptional({ type: () => [FinancialRecurringEntity], default: [] })
  financialRecurringRules: FinancialRecurringEntity[];

  @OneToMany(
    () => FinancialNotificationEntity,
    (financialNotification) => financialNotification.account,
  )
  @ApiPropertyOptional({
    type: () => [FinancialNotificationEntity],
    default: [],
  })
  financialNotifications: FinancialNotificationEntity[];

  @OneToMany(
    () => FinancialDebtEntity,
    (financialDebt) => financialDebt.account,
  )
  @ApiPropertyOptional({ type: () => [FinancialDebtEntity], default: [] })
  financialDebts: FinancialDebtEntity[];
}
