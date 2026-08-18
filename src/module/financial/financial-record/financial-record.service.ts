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

  async createFinancialRecord(record: {
    title: string;
    ticker: string;
    notification: string;
    sub_text: string;
    text_lines: string;
    text_big: string;
    action_names: string;
    app_name: string;
    app_package: string;
    channel: string;
  }): Promise<FinancialRecordEntity> {
    console.log("record", record);
    const newRecord = this.FinancialRecordRepository.create({
      record: String(record),
    });
    return this.FinancialRecordRepository.save(newRecord);
  }
}
