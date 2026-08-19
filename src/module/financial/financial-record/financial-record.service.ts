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

  async createFinancialRecord(record: JSON): Promise<FinancialRecordEntity> {
    console.log("record", record);
    const newRecord = this.FinancialRecordRepository.create({
      record: JSON.stringify(record),
    });
    return this.FinancialRecordRepository.save(newRecord);
  }

  async test(): Promise<any> {
    const getRecord = await this.FinancialRecordRepository.find({
      where: {
        id: 99,
      },
    });

    return getRecord;
  }
}
