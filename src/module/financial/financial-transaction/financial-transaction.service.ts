import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";

@Injectable()
export class FinancialTransactionService {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly FinancialTransactionRepository: Repository<FinancialTransactionEntity>,
  ) {}

}
