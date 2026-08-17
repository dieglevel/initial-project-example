import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class FinancialDashboardService {
  constructor() {}

  async getDashboardData() {
    // Implement your logic to fetch and return dashboard data here
    return {
      totalIncome: 10000,
      totalExpense: 5000,
      netBalance: 5000,
    };
  }
}
