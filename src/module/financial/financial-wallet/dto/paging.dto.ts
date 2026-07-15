import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialWalletEntity } from "../_entities/financial-wallet.entity";

export class FinancialWallet_Paging_Response extends BasePaginatedDto {
  items: FinancialWalletEntity[];
}
