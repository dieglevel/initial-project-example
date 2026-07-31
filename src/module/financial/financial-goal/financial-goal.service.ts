import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseCrudService } from "@/common/service/base-crud.service";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import { Repository } from "typeorm";
import type { JwtPayload } from "@/module/auth/payload.type";
import type {
  FinancialGoal_Projection_Request,
  FinancialGoal_Projection_Response,
} from "./dto/projection.dto";

@Injectable()
export class FinancialGoalService extends BaseCrudService<FinancialGoalEntity> {
  constructor(
    @InjectRepository(FinancialGoalEntity)
    private readonly financialGoalRepository: Repository<FinancialGoalEntity>,
  ) {
    super(financialGoalRepository);
  }

  async getProjection(
    id: number,
    query: FinancialGoal_Projection_Request,
    user: JwtPayload,
  ): Promise<FinancialGoal_Projection_Response> {
    const goal = await this.financialGoalRepository.findOne({
      where: {
        id,
        account: {
          id: user.sub,
        },
      },
    });

    if (!goal) {
      throw new NotFoundException("Financial goal not found");
    }

    const targetAmount = Number(goal.targetAmount ?? 0);
    const currentAmount = Number(goal.currentAmount ?? 0);
    const remainingAmount = Math.max(targetAmount - currentAmount, 0);

    const monthlySavingRate = Number(
      query.monthlySavingRate ?? goal.autoContributionAmount ?? 0,
    );

    const estimatedMonthsToComplete =
      monthlySavingRate > 0
        ? Math.ceil(remainingAmount / monthlySavingRate)
        : null;

    const estimatedCompletionDate =
      estimatedMonthsToComplete !== null
        ? new Date(
            new Date().setMonth(
              new Date().getMonth() + estimatedMonthsToComplete,
            ),
          )
        : null;

    const progressPercentage =
      targetAmount > 0
        ? Number(((currentAmount / targetAmount) * 100).toFixed(2))
        : 0;

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount,
      currentAmount,
      remainingAmount,
      monthlySavingRate,
      estimatedMonthsToComplete,
      estimatedCompletionDate,
      progressPercentage,
    };
  }
}
