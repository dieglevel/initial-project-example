import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialIncomePlanEntity } from "./_entities/financial-income-plan.entity";
import type { FinancialIncomePlan_Upsert_Request } from "./dto/income-plan.dto";

@Injectable()
export class FinancialIncomePlanService {
  constructor(
    @InjectRepository(FinancialIncomePlanEntity)
    private readonly repository: Repository<FinancialIncomePlanEntity>,
  ) {}

  async get(
    month: string,
    user: JwtPayload,
  ): Promise<FinancialIncomePlanEntity | null> {
    this.validateMonth(month);
    return this.repository.findOne({ where: { accountId: user.sub, month } });
  }

  async upsert(
    month: string,
    dto: FinancialIncomePlan_Upsert_Request,
    user: JwtPayload,
  ): Promise<FinancialIncomePlanEntity> {
    this.validateMonth(month);
    await this.repository.upsert(
      {
        accountId: user.sub,
        month,
        expectedAmount: Number(dto.expectedAmount),
      },
      { conflictPaths: ["accountId", "month"] },
    );
    return this.repository.findOneByOrFail({ accountId: user.sub, month });
  }

  private validateMonth(month: string): void {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error("month must use YYYY-MM format");
    }
  }
}
