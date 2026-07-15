import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";

@Injectable()
export class FinancialTransactionService extends BaseCrudService<FinancialTransactionEntity> {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly FinancialTransactionRepository: Repository<FinancialTransactionEntity>,
  ) {
    super(FinancialTransactionRepository);
  }
}
