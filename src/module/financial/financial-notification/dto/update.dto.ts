import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";
import { FinancialNotificationEntity } from "../_entities/financial-notification.entity";

export class FinancialNotification_Update_Request extends PartialType(
  FinancialNotificationEntity,
) {}

export class FinancialNotification_Update_Response extends FinancialNotificationEntity {}
