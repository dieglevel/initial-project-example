import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";
import type { FinancialTransaction_Create_Request } from "./dto/create.dto";
import type { FinancialTransaction_GetWithDate_Request } from "./dto/get-with-date.dto";
import type { FinancialTransaction_GetAll_Response } from "./dto/get-all.dto";
import dayjs from "dayjs";

@Injectable()
export class FinancialTransactionService extends BaseCrudService<FinancialTransactionEntity> {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly FinancialTransactionRepository: Repository<FinancialTransactionEntity>,
  ) {
    super(FinancialTransactionRepository);
  }

  async create(dto: FinancialTransaction_Create_Request) {
    return super.create({
      ...dto,

      wallet: {
        id: dto.walletId,
      },

      category: {
        id: dto.categoryId,
      },
    });
  }

  async getByDate({
    date,
  }: FinancialTransaction_GetWithDate_Request): Promise<
    FinancialTransaction_GetAll_Response[]
  > {
    const targetDate = dayjs(date);

    const startDate = targetDate.startOf("month").toDate();

    const endDate = targetDate.endOf("month").toDate();

    return this.FinancialTransactionRepository.createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.wallet", "wallet")
      .leftJoinAndSelect("transaction.category", "category")
      .where("transaction.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .orderBy("transaction.createdAt", "DESC")
      .getMany();
  }
}
