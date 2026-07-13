import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialWalletEntity } from "./_entities/financial-wallet.entity";

@Injectable()
export class FinancialWalletService {
  constructor(
    @InjectRepository(FinancialWalletEntity)
    private readonly FinancialWalletRepository: Repository<FinancialWalletEntity>,
  ) {}

}
