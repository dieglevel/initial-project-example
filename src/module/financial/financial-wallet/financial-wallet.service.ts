import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialWalletEntity } from "./_entities/financial-wallet.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";

@Injectable()
export class FinancialWalletService extends BaseCrudService<FinancialWalletEntity> {
  constructor(
    @InjectRepository(FinancialWalletEntity)
    private readonly FinancialWalletRepository: Repository<FinancialWalletEntity>,
  ) {
    super(FinancialWalletRepository);
  }
}
