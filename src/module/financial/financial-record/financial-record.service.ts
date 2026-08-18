import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialRecordEntity } from "./_entities/financial-record.entity";

@Injectable()
export class FinancialRecordService {
  constructor(
    @InjectRepository(FinancialRecordEntity)
    private readonly FinancialRecordRepository: Repository<FinancialRecordEntity>,
  ) {}

  async createFinancialRecord(record: any): Promise<FinancialRecordEntity> {
    const newRecord = this.FinancialRecordRepository.create({ record: record });
    return this.FinancialRecordRepository.save(newRecord);
  }
}
