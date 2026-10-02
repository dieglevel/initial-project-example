import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialSettingEntity } from "./_entities/financial-setting.entity";
import {
  FINANCIAL_SETTING_THEME,
  FINANCIAL_SETTING_THEME_MODE,
} from "./financial-setting.enum";

@Injectable()
export class FinancialSettingService {
  constructor(
    @InjectRepository(FinancialSettingEntity)
    private readonly FinancialSettingRepository: Repository<FinancialSettingEntity>,
  ) {}

  private async initializeFinancialSetting(
    userId: number,
  ): Promise<FinancialSettingEntity> {
    const newSetting = this.FinancialSettingRepository.create({
      accountId: userId,
      cycleStartDate: 1,
      theme: FINANCIAL_SETTING_THEME.HUTAO,
      themeMode: FINANCIAL_SETTING_THEME_MODE.LIGHT,
    });

    return this.FinancialSettingRepository.save(newSetting);
  }

  public async getFinancialSettingByUserId(
    userId: number,
  ): Promise<FinancialSettingEntity | null> {
    return this.FinancialSettingRepository.findOne({
      where: {
        accountId: userId,
      },
    });
  }

  public async updateFinancialSetting(
    userId: number,
    updateData: Partial<FinancialSettingEntity>,
  ): Promise<FinancialSettingEntity> {
    let setting = await this.getFinancialSettingByUserId(userId);

    if (!setting) {
      setting = await this.initializeFinancialSetting(userId);
    }

    this.FinancialSettingRepository.merge(setting, updateData);

    return this.FinancialSettingRepository.save(setting);
  }
}
