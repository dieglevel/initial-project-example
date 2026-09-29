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

  private async initializeFinancialSetting(userId: number): Promise<void> {
    const defaultSettings: Partial<FinancialSettingEntity> = {
      cycleStartDate: 1,
      theme: FINANCIAL_SETTING_THEME.HUTAO,
      themeMode: FINANCIAL_SETTING_THEME_MODE.LIGHT,
    };

    const newSetting = this.FinancialSettingRepository.create({
      ...defaultSettings,
      accountId: userId,
    });
    await this.FinancialSettingRepository.save(newSetting);
  }

  public async getFinancialSettingByUserId(
    userId: number,
  ): Promise<FinancialSettingEntity | null> {
    const setting = await this.FinancialSettingRepository.findOne({
      where: { accountId: userId },
    });
    if (!setting) {
      await this.initializeFinancialSetting(userId);
      return this.getFinancialSettingByUserId(userId);
    }
    return setting;
  }

  public async updateFinancialSetting(
    userId: number,
    updateData: Partial<FinancialSettingEntity>,
  ): Promise<FinancialSettingEntity> {
    console.log(
      "Updating financial setting for userId:",
      userId,
      "with data:",
      updateData,
    );

    const existingSetting = await this.getFinancialSettingByUserId(userId);

    if (!existingSetting) {
      await this.initializeFinancialSetting(userId);
      return this.updateFinancialSetting(userId, updateData);
    }

    const updatedSetting = this.FinancialSettingRepository.merge(
      existingSetting,
      updateData,
    );
    return this.FinancialSettingRepository.save(updatedSetting);
  }
}
