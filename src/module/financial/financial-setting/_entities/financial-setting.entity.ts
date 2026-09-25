import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity } from "typeorm";

export enum FINANCIAL_SETTING_THEME_MODE {
  LIGHT = "light",
  DARK = "dark",
}

export enum FINANCIAL_SETTING_THEME {
  HUTAO = "hutao",
}

@Entity("financial-setting")
@ApiEntity()
export class FinancialSettingEntity extends BaseEntity {
  @Column({
    type: "enum",
    enum: FINANCIAL_SETTING_THEME_MODE,
    default: FINANCIAL_SETTING_THEME_MODE.LIGHT,
  })
  themeMode: FINANCIAL_SETTING_THEME_MODE = FINANCIAL_SETTING_THEME_MODE.LIGHT;

  @Column({
    type: "enum",
    enum: FINANCIAL_SETTING_THEME,
    default: FINANCIAL_SETTING_THEME.HUTAO,
  })
  theme: FINANCIAL_SETTING_THEME = FINANCIAL_SETTING_THEME.HUTAO;

  @Column({ type: "int", default: 1 })
  cycleStartDate: number = 1;
}
