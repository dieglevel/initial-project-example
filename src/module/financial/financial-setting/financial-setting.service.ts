import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialSettingEntity } from "./_entities/financial-setting.entity";

@Injectable()
export class FinancialSettingService {
  constructor(
    @InjectRepository(FinancialSettingEntity)
    private readonly FinancialSettingRepository: Repository<FinancialSettingEntity>,
  ) {}
}
