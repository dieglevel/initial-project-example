import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import {
  FINANCIAL_SETTING_CURRENCY,
  FINANCIAL_SETTING_LANGUAGE,
  FINANCIAL_SETTING_THEME,
  FINANCIAL_SETTING_THEME_MODE,
} from "../financial-setting.enum";
import { IsEnum, IsOptional } from "class-validator";

@Entity("financial-setting")
@ApiEntity()
export class FinancialSettingEntity extends BaseEntity {
  @Column({
    type: "enum",
    enum: FINANCIAL_SETTING_THEME_MODE,
    default: FINANCIAL_SETTING_THEME_MODE.LIGHT,
  })
  @IsEnum(FINANCIAL_SETTING_THEME_MODE)
  @IsOptional()
  themeMode: FINANCIAL_SETTING_THEME_MODE = FINANCIAL_SETTING_THEME_MODE.LIGHT;

  @Column({
    type: "enum",
    enum: FINANCIAL_SETTING_THEME,
    default: FINANCIAL_SETTING_THEME.HUTAO,
  })
  @IsEnum(FINANCIAL_SETTING_THEME)
  @IsOptional()
  theme: FINANCIAL_SETTING_THEME = FINANCIAL_SETTING_THEME.HUTAO;

  @Column({ type: "int", default: 1 })
  @IsOptional()
  cycleStartDate: number = 1;

  @Column({
    type: "enum",
    enum: FINANCIAL_SETTING_LANGUAGE,
    default: FINANCIAL_SETTING_LANGUAGE.VN,
  })
  @IsEnum(FINANCIAL_SETTING_LANGUAGE)
  @IsOptional()
  language: FINANCIAL_SETTING_LANGUAGE;

  @Column({
    type: "enum",
    enum: FINANCIAL_SETTING_CURRENCY,
    default: FINANCIAL_SETTING_CURRENCY.VND,
  })
  @IsEnum(FINANCIAL_SETTING_CURRENCY)
  @IsOptional()
  currency: FINANCIAL_SETTING_CURRENCY;

  @OneToOne(() => AccountEntity, (account) => account.financialSetting, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "accountId" })
  account: AccountEntity;

  @Column({ type: "int", unique: true, nullable: false, select: false })
  accountId: number;
}
