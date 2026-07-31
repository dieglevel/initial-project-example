import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialNotificationEntity } from "../_entities/financial-notification.entity";

export class FinancialNotification_Paging_Response extends BasePaginatedDto {
  items: FinancialNotificationEntity[];
}
